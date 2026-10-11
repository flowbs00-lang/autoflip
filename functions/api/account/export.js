import { handleError, json, methodNotAllowed, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";
import { ensureCommunitySchema } from "../../_lib/community.js";
import { ensureLegalSchema } from "../../_lib/legal.js";
import { ensureStoreSchema } from "../../_lib/store.js";
import { ensureSupportSchema } from "../../_lib/support.js";

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function decodeSave(value) {
  if (!value) return null;
  if (!value.startsWith("gz:")) return JSON.parse(value);
  const stream = new Blob([base64ToBytes(value.slice(3))]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session?.nickname) throw new RequestError("authentication_required", 401);
    const db = context.env.DB;
    await Promise.all([ensureCommunitySchema(db), ensureLegalSchema(db), ensureStoreSchema(db), ensureSupportSchema(db)]);
    const [user, save, consents, messages, blocks, reports, orders, refunds, tickets] = await Promise.all([
      db.prepare("SELECT id, nickname, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?").bind(session.id).first(),
      db.prepare("SELECT revision, data_json AS dataJson, updated_at AS updatedAt FROM game_saves WHERE user_id = ?").bind(session.id).first(),
      db.prepare("SELECT consent_type AS type, document_version AS version, granted_at AS grantedAt, revoked_at AS revokedAt FROM user_consents WHERE user_id = ? ORDER BY granted_at").bind(session.id).all(),
      db.prepare("SELECT id, channel, body, created_at AS createdAt, deleted_at AS deletedAt FROM community_messages WHERE user_id = ? ORDER BY created_at DESC").bind(session.id).all(),
      db.prepare("SELECT blocked_user_id AS userId, created_at AS createdAt FROM community_blocks WHERE blocker_user_id = ?").bind(session.id).all(),
      db.prepare("SELECT id, message_id AS messageId, reason, status, created_at AS createdAt FROM community_reports WHERE reporter_user_id = ?").bind(session.id).all(),
      db.prepare("SELECT id, product_code AS productCode, amount_rub AS amountRub, status, created_at AS createdAt, paid_at AS paidAt FROM store_orders WHERE user_id = ? ORDER BY created_at DESC").bind(session.id).all(),
      db.prepare("SELECT id, order_id AS orderId, reason, status, created_at AS createdAt, updated_at AS updatedAt FROM store_refund_requests WHERE user_id = ? ORDER BY created_at DESC").bind(session.id).all(),
      db.prepare("SELECT id, category, subject, message, status, response, created_at AS createdAt, updated_at AS updatedAt FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC").bind(session.id).all()
    ]);
    const payload = {
      exportedAt: new Date().toISOString(),
      account: user,
      save: save ? { revision: Number(save.revision), updatedAt: Number(save.updatedAt), data: await decodeSave(save.dataJson) } : null,
      consents: consents.results || [], messages: messages.results || [], blocks: blocks.results || [],
      reports: reports.results || [], orders: orders.results || [], refundRequests: refunds.results || [], supportTickets: tickets.results || []
    };
    return json(payload, 200, {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="autoflip-${session.id}-export.json"`
    });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return methodNotAllowed(["GET"]);
}
