import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { recordLegalAcceptance, publicRegistrationEnabled, validateRequiredLegalAcceptance } from "../../_lib/legal.js";
import { buildCredentialValues, ensurePasswordAuthSchema, insertCredentials } from "../../_lib/password-auth.js";
import { createSession } from "../../_lib/session.js";
import { createLocalUser, publicUser } from "../../_lib/users.js";

export async function onRequestPost(context) {
  let createdUserId = null;
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    if (!publicRegistrationEnabled(context.env)) throw new RequestError("closed_beta_only", 403);
    const body = await readJson(context.request, 4096);
    const legal = validateRequiredLegalAcceptance(body.legal);
    await ensurePasswordAuthSchema(context.env.DB);
    const user = await createLocalUser(context.env.DB, null, "guest");
    createdUserId = user.id;
    const credentials = await buildCredentialValues({ accountType: "guest" });
    await insertCredentials(context.env.DB, user.id, credentials);
    await recordLegalAcceptance(context.env.DB, user.id, legal);
    const session = await createSession(context.env.DB, user.id);
    return json({
      ok: true,
      recoveryCode: credentials.recoveryCode,
      user: publicUser(user)
    }, 201, { "Set-Cookie": session.cookie });
  } catch (error) {
    if (createdUserId) {
      await context.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(createdUserId).run().catch(() => null);
    }
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
