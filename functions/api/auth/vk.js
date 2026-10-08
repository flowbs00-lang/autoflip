import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { createSession } from "../../_lib/session.js";
import { publicUser, upsertVkUser } from "../../_lib/users.js";

const VK_APP_ID = "54810634";
const VK_USER_INFO_URL = `https://id.vk.ru/oauth2/user_info?client_id=${VK_APP_ID}`;

async function verifyVkAccessToken(accessToken) {
  const response = await fetch(VK_USER_INFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ access_token: accessToken })
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.user?.user_id) {
    throw new RequestError("vk_token_rejected", 401);
  }

  return payload.user;
}

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);

    const body = await readJson(context.request);
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
    if (accessToken.length < 20 || accessToken.length > 4096) {
      throw new RequestError("invalid_access_token");
    }

    const vkUser = await verifyVkAccessToken(accessToken);
    const userId = await upsertVkUser(context.env.DB, vkUser);
    const user = await context.env.DB.prepare(`
      SELECT id, nickname, first_name, last_name, avatar_url
      FROM users WHERE id = ? LIMIT 1
    `).bind(userId).first();
    const session = await createSession(context.env.DB, userId);

    return json(
      { ok: true, needsNickname: !user.nickname, user: publicUser(user) },
      200,
      { "Set-Cookie": session.cookie }
    );
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
