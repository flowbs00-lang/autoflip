import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../_lib/http.js";
import { getSession } from "../_lib/session.js";
import { communityCities, ensureCommunitySchema, syncCommunityProfile, validCommunityCity } from "../_lib/community.js";

const MESSAGE_LIMIT = 400;

async function requireUser(context) {
  if (!context.env.DB) throw new RequestError("database_not_configured", 503);
  const session = await getSession(context.env.DB, context.request);
  if (!session) throw new RequestError("authentication_required", 401);
  if (!session.nickname) throw new RequestError("profile_incomplete", 403);
  await ensureCommunitySchema(context.env.DB);
  return session;
}

function clanId() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `clan_${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function membership(db, userId) {
  return db.prepare(`
    SELECT c.id, c.name, c.tag, c.owner_user_id AS ownerUserId,
           CASE WHEN c.owner_user_id = cm.user_id THEN 'leader' ELSE COALESCE(cm.role, 'member') END AS role
    FROM clan_members cm JOIN clans c ON c.id = cm.clan_id
    WHERE cm.user_id = ? LIMIT 1
  `).bind(userId).first();
}

async function profile(db, userId) {
  await db.prepare("INSERT OR IGNORE INTO community_profiles (user_id, reputation, city, updated_at) VALUES (?, 0, 'Москва', ?)")
    .bind(userId, Date.now()).run();
  return db.prepare("SELECT reputation, city FROM community_profiles WHERE user_id = ? LIMIT 1").bind(userId).first();
}

function channelFrom(value, ownClan) {
  const channel = String(value || "global");
  if (channel === "global") return channel;
  if (channel.startsWith("region:")) {
    const city = channel.slice(7);
    if (!validCommunityCity(city)) throw new RequestError("invalid_channel");
    return channel;
  }
  if (channel === "clan" && ownClan) return `clan:${ownClan.id}`;
  throw new RequestError("invalid_channel");
}

async function snapshot(db, session, channelValue) {
  const ownProfile = await profile(db, session.id);
  const ownClan = await membership(db, session.id);
  const channel = channelFrom(channelValue, ownClan);
  const [messagesResult, playersResult, clansResult, clanMembersResult] = await Promise.all([
    db.prepare(`
      SELECT m.id, m.body, m.created_at AS createdAt, u.id AS userId, u.nickname,
             COALESCE(c.tag, '') AS clanTag
      FROM community_messages m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN clan_members cm ON cm.user_id = u.id
      LEFT JOIN clans c ON c.id = cm.clan_id
      WHERE m.channel = ? ORDER BY m.created_at DESC LIMIT 60
    `).bind(channel).all(),
    db.prepare(`
      SELECT u.id, u.nickname, p.reputation, p.city, COALESCE(c.tag, '') AS clanTag
      FROM community_profiles p JOIN users u ON u.id = p.user_id
      LEFT JOIN clan_members cm ON cm.user_id = u.id
      LEFT JOIN clans c ON c.id = cm.clan_id
      ORDER BY p.reputation DESC, u.nickname COLLATE NOCASE ASC LIMIT 100
    `).all(),
    db.prepare(`
      SELECT c.id, c.name, c.tag, c.owner_user_id AS ownerUserId,
             COUNT(cm.user_id) AS members, COALESCE(SUM(p.reputation), 0) AS reputation
      FROM clans c
      LEFT JOIN clan_members cm ON cm.clan_id = c.id
      LEFT JOIN community_profiles p ON p.user_id = cm.user_id
      GROUP BY c.id ORDER BY reputation DESC, members DESC, c.name COLLATE NOCASE ASC LIMIT 100
    `).all(),
    ownClan ? db.prepare(`
      SELECT u.id, u.nickname, p.reputation, p.city, cm.joined_at AS joinedAt,
             CASE WHEN c.owner_user_id = u.id THEN 'leader' ELSE COALESCE(cm.role, 'member') END AS role
      FROM clan_members cm
      JOIN users u ON u.id = cm.user_id
      JOIN clans c ON c.id = cm.clan_id
      LEFT JOIN community_profiles p ON p.user_id = u.id
      WHERE cm.clan_id = ?
      ORDER BY CASE WHEN c.owner_user_id = u.id THEN 0 WHEN cm.role = 'coleader' THEN 1 ELSE 2 END,
               p.reputation DESC, u.nickname COLLATE NOCASE ASC
      LIMIT 50
    `).bind(ownClan.id).all() : Promise.resolve({ results: [] })
  ]);
  return {
    ok: true,
    channel,
    cities: communityCities(),
    me: {
      id: session.id,
      nickname: session.nickname,
      reputation: Number(ownProfile?.reputation || 0),
      city: ownProfile?.city || "Москва",
      clan: ownClan || null
    },
    messages: [...(messagesResult.results || [])].reverse(),
    players: playersResult.results || [],
    clans: clansResult.results || [],
    clanMembers: clanMembersResult.results || [],
    clanLimit: 50
  };
}

export async function onRequestGet(context) {
  try {
    const session = await requireUser(context);
    const url = new URL(context.request.url);
    return json(await snapshot(context.env.DB, session, url.searchParams.get("channel")));
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    const session = await requireUser(context);
    const body = await readJson(context.request, 8_192);
    const action = String(body?.action || "");
    const db = context.env.DB;

    if (action === "sync") {
      await syncCommunityProfile(db, session.id, body.reputation, body.city);
      return json({ ok: true });
    }

    const ownClan = await membership(db, session.id);
    if (action === "send") {
      const channel = channelFrom(body.channel, ownClan);
      const message = String(body.message || "").trim().replace(/\s+/gu, " ");
      if (!message || message.length > MESSAGE_LIMIT) throw new RequestError("invalid_message");
      const recent = await db.prepare("SELECT created_at FROM community_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
        .bind(session.id).first();
      const now = Date.now();
      if (recent && now - Number(recent.created_at) < 2_500) throw new RequestError("message_rate_limited", 429);
      await db.prepare("INSERT INTO community_messages (user_id, channel, body, created_at) VALUES (?, ?, ?, ?)")
        .bind(session.id, channel, message, now).run();
      return json({ ok: true });
    }

    if (action === "create_clan") {
      if (ownClan) throw new RequestError("already_in_clan", 409);
      const name = String(body.name || "").trim();
      const tag = String(body.tag || "").trim().toUpperCase();
      if (!/^[\p{L}\p{N} ._-]{3,24}$/u.test(name) || !/^[\p{L}\p{N}]{2,5}$/u.test(tag)) throw new RequestError("invalid_clan");
      const id = clanId(), now = Date.now();
      try {
        await db.batch([
          db.prepare("INSERT INTO clans (id, name, tag, owner_user_id, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, name, tag, session.id, now),
          db.prepare("INSERT INTO clan_members (user_id, clan_id, role, joined_at) VALUES (?, ?, 'leader', ?)").bind(session.id, id, now)
        ]);
      } catch {
        throw new RequestError("clan_name_or_tag_taken", 409);
      }
      return json({ ok: true, clanId: id });
    }

    if (action === "join_clan") {
      if (ownClan) throw new RequestError("already_in_clan", 409);
      const clan = await db.prepare(`
        SELECT c.id, COUNT(cm.user_id) AS members
        FROM clans c LEFT JOIN clan_members cm ON cm.clan_id = c.id
        WHERE c.id = ? GROUP BY c.id LIMIT 1
      `).bind(String(body.clanId || "")).first();
      if (!clan) throw new RequestError("clan_not_found", 404);
      if (Number(clan.members || 0) >= 50) throw new RequestError("clan_full", 409);
      try {
        await db.prepare("INSERT INTO clan_members (user_id, clan_id, role, joined_at) VALUES (?, ?, 'member', ?)")
          .bind(session.id, clan.id, Date.now()).run();
      } catch (error) {
        if (String(error?.message || error).includes("clan_full")) throw new RequestError("clan_full", 409);
        throw error;
      }
      return json({ ok: true });
    }

    if (action === "set_role") {
      if (!ownClan || ownClan.ownerUserId !== session.id) throw new RequestError("not_clan_owner", 403);
      const userId = String(body.userId || "");
      const role = String(body.role || "");
      if (!userId || userId === session.id || !["coleader", "member"].includes(role)) throw new RequestError("invalid_clan_role");
      const target = await db.prepare("SELECT user_id FROM clan_members WHERE user_id = ? AND clan_id = ? LIMIT 1")
        .bind(userId, ownClan.id).first();
      if (!target) throw new RequestError("clan_member_not_found", 404);
      await db.prepare("UPDATE clan_members SET role = ? WHERE user_id = ? AND clan_id = ?")
        .bind(role, userId, ownClan.id).run();
      return json({ ok: true });
    }

    if (action === "kick_member") {
      if (!ownClan) throw new RequestError("not_in_clan", 409);
      const userId = String(body.userId || "");
      if (!userId || userId === session.id || userId === ownClan.ownerUserId) throw new RequestError("invalid_clan_member");
      const target = await db.prepare("SELECT role FROM clan_members WHERE user_id = ? AND clan_id = ? LIMIT 1")
        .bind(userId, ownClan.id).first();
      if (!target) throw new RequestError("clan_member_not_found", 404);
      const mayKick = ownClan.ownerUserId === session.id || (ownClan.role === "coleader" && target.role === "member");
      if (!mayKick) throw new RequestError("clan_permission_denied", 403);
      await db.prepare("DELETE FROM clan_members WHERE user_id = ? AND clan_id = ?").bind(userId, ownClan.id).run();
      return json({ ok: true });
    }

    if (action === "leave_clan") {
      if (!ownClan) throw new RequestError("not_in_clan", 409);
      if (ownClan.ownerUserId === session.id) throw new RequestError("owner_cannot_leave", 409);
      await db.prepare("DELETE FROM clan_members WHERE user_id = ?").bind(session.id).run();
      return json({ ok: true });
    }

    if (action === "delete_clan") {
      if (!ownClan || ownClan.ownerUserId !== session.id) throw new RequestError("not_clan_owner", 403);
      await db.batch([
        db.prepare("DELETE FROM clan_members WHERE clan_id = ?").bind(ownClan.id),
        db.prepare("DELETE FROM clans WHERE id = ?").bind(ownClan.id)
      ]);
      return json({ ok: true });
    }

    throw new RequestError("unknown_action");
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["GET", "POST"]);
}
