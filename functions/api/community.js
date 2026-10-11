import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../_lib/http.js";
import { getSession } from "../_lib/session.js";
import { activeCommunityBan, communityCities, ensureCommunitySchema, runCommunityMaintenance, syncCommunityProfile, validCommunityCity, validateCommunityMessage } from "../_lib/community.js";
import { ensureLegalSchema, LEGAL_VERSIONS, publicProfileAllowed } from "../_lib/legal.js";
import { isAdminUser } from "../_lib/admin.js";

const MESSAGE_LIMIT = 400;
const PUBLIC_CAR_LIMIT = 30;
const PUBLIC_PLATE_LIMIT = 120;

async function requireUser(context) {
  if (!context.env.DB) throw new RequestError("database_not_configured", 503);
  const session = await getSession(context.env.DB, context.request);
  if (!session) throw new RequestError("authentication_required", 401);
  if (!session.nickname) throw new RequestError("profile_incomplete", 403);
  await ensureCommunitySchema(context.env.DB);
  await ensureLegalSchema(context.env.DB);
  await runCommunityMaintenance(context.env.DB);
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
  return db.prepare("SELECT reputation, city, updated_at AS updatedAt FROM community_profiles WHERE user_id = ? LIMIT 1").bind(userId).first();
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function readGameSave(row) {
  if (!row?.data_json) return {};
  try {
    if (!row.data_json.startsWith("gz:")) return JSON.parse(row.data_json);
    const decompressed = new Blob([base64ToBytes(row.data_json.slice(3))])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    const value = JSON.parse(await new Response(decompressed).text());
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function publicText(value, limit = 80) {
  return String(value == null ? "" : value).trim().slice(0, limit);
}

function publicPhoto(value) {
  const photo = publicText(value, 180);
  return /^(?:\.\/)?assets\/cars\/[a-z0-9._/-]+\.webp$/i.test(photo) ? photo.replace(/^\.\//, "") : "";
}

function publicCar(car) {
  return {
    name: publicText(car?.name || "Автомобиль"),
    year: Math.max(1950, Math.min(2100, Math.floor(Number(car?.year) || 2000))),
    km: Math.max(0, Math.floor(Number(car?.km) || 0)),
    city: validCommunityCity(car?.city) ? String(car.city) : "",
    value: Math.max(0, Math.floor(Number(car?.market || car?.sale || car?.buy) || 0)),
    repaired: Boolean(car?.repaired),
    photo: publicPhoto(car?.photoUrl)
  };
}

function publicPlate(plate) {
  const region = plate?.region && typeof plate.region === "object" ? plate.region : {};
  return {
    number: publicText(plate?.number, 12).toUpperCase(),
    region: publicText(region.code, 3),
    city: publicText(region.city, 40),
    rarity: ["common", "uncommon", "rare", "superrare", "forbidden", "priceless"].includes(plate?.rarity) ? plate.rarity : "common",
    value: Math.max(0, Math.floor(Number(plate?.value) || 0))
  };
}

async function publicPlayerProfile(db, viewerId, userId) {
  const targetId = publicText(userId, 80);
  if (!targetId) throw new RequestError("player_not_found", 404);
  if (targetId !== viewerId && !(await publicProfileAllowed(db, targetId))) {
    throw new RequestError("player_profile_private", 403);
  }
  const user = await db.prepare("SELECT id, nickname, created_at AS createdAt FROM users WHERE id = ? LIMIT 1").bind(targetId).first();
  if (!user) throw new RequestError("player_not_found", 404);
  const [targetProfile, targetClan, saveRow] = await Promise.all([
    profile(db, targetId),
    membership(db, targetId),
    db.prepare("SELECT data_json, updated_at AS updatedAt FROM game_saves WHERE user_id = ? LIMIT 1").bind(targetId).first()
  ]);
  const state = await readGameSave(saveRow);
  const savedCars = Array.isArray(state.cars) ? state.cars : (state.car ? [state.car] : []);
  const cars = savedCars.slice(0, PUBLIC_CAR_LIMIT).map(publicCar);
  const savedPlates = Array.isArray(state?.plates?.items) ? state.plates.items : [];
  const plates = savedPlates.slice(0, PUBLIC_PLATE_LIMIT).map(publicPlate).filter((plate) => plate.number);
  const level = Math.max(1, Math.min(10, Math.floor(Number(state?.garageProgress?.level || state?.garageLevel) || 1)));
  return {
    ok: true,
    player: {
      id: user.id,
      nickname: user.nickname,
      createdAt: Number(user.createdAt || 0),
      updatedAt: Number(saveRow?.updatedAt || 0),
      city: targetProfile?.city || "Москва",
      reputation: Number(targetProfile?.reputation || 0),
      clan: targetClan ? { id: targetClan.id, name: targetClan.name, tag: targetClan.tag, role: targetClan.role } : null,
      garageLevel: level,
      garageValue: cars.reduce((total, car) => total + car.value, 0),
      cars,
      plates,
      online: Date.now() - Math.max(Number(targetProfile?.updatedAt || 0), Number(saveRow?.updatedAt || 0)) < 5 * 60_000,
      isMe: targetId === viewerId
    }
  };
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

async function snapshot(db, env, session, channelValue) {
  const ownProfile = await profile(db, session.id);
  const ownClan = await membership(db, session.id);
  const channel = channelFrom(channelValue, ownClan);
  const admin = isAdminUser(env, session.id);
  const [messagesResult, playersResult, clansResult, clanMembersResult, blockedResult, ban] = await Promise.all([
    db.prepare(`
      SELECT m.id, m.body, m.created_at AS createdAt, u.id AS userId, u.nickname,
             COALESCE(c.tag, '') AS clanTag
      FROM community_messages m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN clan_members cm ON cm.user_id = u.id
      LEFT JOIN clans c ON c.id = cm.clan_id
      WHERE m.channel = ? AND m.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM community_blocks b WHERE b.blocker_user_id = ? AND b.blocked_user_id = m.user_id)
      ORDER BY m.created_at DESC LIMIT 60
    `).bind(channel, session.id).all(),
    db.prepare(`
      SELECT u.id, u.nickname, p.reputation, p.city, COALESCE(c.tag, '') AS clanTag
      FROM community_profiles p JOIN users u ON u.id = p.user_id
      JOIN user_consents uc ON uc.user_id = u.id
        AND uc.consent_type = 'public_profile' AND uc.document_version = ? AND uc.revoked_at IS NULL
      LEFT JOIN clan_members cm ON cm.user_id = u.id
      LEFT JOIN clans c ON c.id = cm.clan_id
      ORDER BY p.reputation DESC, u.nickname COLLATE NOCASE ASC LIMIT 100
    `).bind(LEGAL_VERSIONS.publicProfile).all(),
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
    `).bind(ownClan.id).all() : Promise.resolve({ results: [] }),
    db.prepare("SELECT blocked_user_id AS userId FROM community_blocks WHERE blocker_user_id = ?").bind(session.id).all(),
    activeCommunityBan(db, session.id)
  ]);
  let moderation = null;
  if (admin) {
    const [reports, bans] = await Promise.all([
      db.prepare(`SELECT r.id, r.reason, r.created_at AS createdAt, r.reported_user_id AS userId,
          reporter.nickname AS reporterNickname, author.nickname, m.id AS messageId, m.body
        FROM community_reports r JOIN community_messages m ON m.id = r.message_id
        JOIN users reporter ON reporter.id = r.reporter_user_id JOIN users author ON author.id = r.reported_user_id
        WHERE r.status = 'open' ORDER BY r.created_at ASC LIMIT 100`).all(),
      db.prepare(`SELECT b.user_id AS userId, u.nickname, b.reason, b.expires_at AS expiresAt, b.created_at AS createdAt
        FROM community_bans b JOIN users u ON u.id = b.user_id ORDER BY b.created_at DESC LIMIT 100`).all()
    ]);
    moderation = { reports: reports.results || [], bans: bans.results || [] };
  }
  return {
    ok: true,
    channel,
    cities: communityCities(),
    me: {
      id: session.id,
      nickname: session.nickname,
      reputation: Number(ownProfile?.reputation || 0),
      city: ownProfile?.city || "Москва",
      clan: ownClan || null,
      isAdmin: admin,
      chatBan: ban || null
    },
    messages: [...(messagesResult.results || [])].reverse(),
    players: playersResult.results || [],
    clans: clansResult.results || [],
    clanMembers: clanMembersResult.results || [],
    clanLimit: 50,
    blockedUserIds: (blockedResult.results || []).map((row) => row.userId),
    moderation
  };
}

async function moderationLog(db, adminId, action, targetUserId = null, messageId = null, reason = "") {
  await db.prepare(`INSERT INTO community_moderation_log
    (id, admin_user_id, target_user_id, message_id, action, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), adminId, targetUserId, messageId, action, reason, Date.now()).run();
}

export async function onRequestGet(context) {
  try {
    const session = await requireUser(context);
    const url = new URL(context.request.url);
    if (url.searchParams.has("profile")) {
      return json(await publicPlayerProfile(context.env.DB, session.id, url.searchParams.get("profile")));
    }
    return json(await snapshot(context.env.DB, context.env, session, url.searchParams.get("channel")));
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
    const admin = isAdminUser(context.env, session.id);

    if (action === "sync") {
      await syncCommunityProfile(db, session.id, body.reputation, body.city);
      return json({ ok: true });
    }

    const ownClan = await membership(db, session.id);
    if (action === "send") {
      const ban = await activeCommunityBan(db, session.id);
      if (ban) throw new RequestError("chat_banned", 403);
      const channel = channelFrom(body.channel, ownClan);
      const message = validateCommunityMessage(body.message);
      const recent = await db.prepare("SELECT created_at FROM community_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
        .bind(session.id).first();
      const now = Date.now();
      if (recent && now - Number(recent.created_at) < 2_500) throw new RequestError("message_rate_limited", 429);
      await db.prepare("INSERT INTO community_messages (user_id, channel, body, created_at) VALUES (?, ?, ?, ?)")
        .bind(session.id, channel, message, now).run();
      return json({ ok: true });
    }

    if (action === "report_message") {
      const messageId = Math.floor(Number(body.messageId));
      const reason = publicText(body.reason, 300);
      if (!messageId || reason.length < 5) throw new RequestError("invalid_report");
      const message = await db.prepare("SELECT id, user_id AS userId FROM community_messages WHERE id = ? AND deleted_at IS NULL LIMIT 1").bind(messageId).first();
      if (!message) throw new RequestError("message_not_found", 404);
      if (message.userId === session.id) throw new RequestError("cannot_report_self");
      try {
        await db.prepare(`INSERT INTO community_reports
          (id, message_id, reporter_user_id, reported_user_id, reason, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'open', ?)`)
          .bind(crypto.randomUUID(), messageId, session.id, message.userId, reason, Date.now()).run();
      } catch (error) {
        if (/unique|constraint/iu.test(String(error?.message || error))) throw new RequestError("report_already_sent", 409);
        throw error;
      }
      return json({ ok: true });
    }

    if (action === "block_user" || action === "unblock_user") {
      const userId = publicText(body.userId, 80);
      if (!userId || userId === session.id) throw new RequestError("invalid_player");
      const target = await db.prepare("SELECT id FROM users WHERE id = ? LIMIT 1").bind(userId).first();
      if (!target) throw new RequestError("player_not_found", 404);
      if (action === "block_user") {
        await db.prepare("INSERT OR IGNORE INTO community_blocks (blocker_user_id, blocked_user_id, created_at) VALUES (?, ?, ?)")
          .bind(session.id, userId, Date.now()).run();
      } else {
        await db.prepare("DELETE FROM community_blocks WHERE blocker_user_id = ? AND blocked_user_id = ?").bind(session.id, userId).run();
      }
      return json({ ok: true });
    }

    if (action.startsWith("admin_")) {
      if (!admin) throw new RequestError("admin_required", 403);
      const reason = publicText(body.reason, 300) || "Нарушение правил сообщества";
      if (action === "admin_delete_message") {
        const messageId = Math.floor(Number(body.messageId));
        const message = await db.prepare("SELECT user_id AS userId FROM community_messages WHERE id = ? LIMIT 1").bind(messageId).first();
        if (!message) throw new RequestError("message_not_found", 404);
        await db.prepare("UPDATE community_messages SET deleted_at = ?, deleted_by = ?, delete_reason = ? WHERE id = ?")
          .bind(Date.now(), session.id, reason, messageId).run();
        await moderationLog(db, session.id, "delete_message", message.userId, messageId, reason);
        return json({ ok: true });
      }
      if (action === "admin_ban_user") {
        const userId = publicText(body.userId, 80);
        if (!userId || userId === session.id || isAdminUser(context.env, userId)) throw new RequestError("invalid_player");
        const target = await db.prepare("SELECT id FROM users WHERE id = ? LIMIT 1").bind(userId).first();
        if (!target) throw new RequestError("player_not_found", 404);
        const hours = Math.max(0, Math.min(24 * 365, Math.floor(Number(body.durationHours) || 0)));
        const expiresAt = hours ? Date.now() + hours * 60 * 60_000 : null;
        await db.prepare(`INSERT INTO community_bans (user_id, reason, expires_at, created_at, created_by)
          VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET reason=excluded.reason,
          expires_at=excluded.expires_at, created_at=excluded.created_at, created_by=excluded.created_by`)
          .bind(userId, reason, expiresAt, Date.now(), session.id).run();
        await moderationLog(db, session.id, "ban_user", userId, null, reason);
        return json({ ok: true });
      }
      if (action === "admin_unban_user") {
        const userId = publicText(body.userId, 80);
        await db.prepare("DELETE FROM community_bans WHERE user_id = ?").bind(userId).run();
        await moderationLog(db, session.id, "unban_user", userId);
        return json({ ok: true });
      }
      if (action === "admin_resolve_report") {
        const reportId = publicText(body.reportId, 80);
        await db.prepare(`UPDATE community_reports SET status = 'resolved', reviewed_at = ?, reviewed_by = ?, resolution = ? WHERE id = ?`)
          .bind(Date.now(), session.id, reason, reportId).run();
        await moderationLog(db, session.id, "resolve_report", null, null, reason);
        return json({ ok: true });
      }
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
