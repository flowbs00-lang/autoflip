import { getSession } from "./_lib/session.js";
import { legalStatus } from "./_lib/legal.js";
import { ensureRuntimeMigrations } from "./_lib/migrations.js";
import { enforceApiSecurity, recordSuspiciousResponse } from "./_lib/security.js";

const SECURITY_HEADERS = Object.freeze({
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()"
});

const STRICT_CSP = "default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-attr 'none'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";
const AUTH_CSP = "default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.vk.ru; connect-src 'self' https://*.vk.ru; frame-src https://*.vk.ru; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";
// The current game bundle still contains inline legacy scripts, handlers and
// generated style attributes. Keep that exception isolated to /app/ only.
const LEGACY_GAME_CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.wikimedia.org https://images.unsplash.com; connect-src 'self' https://*.vk.ru; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";

function contentSecurityPolicy(pathname) {
  if (pathname === "/app" || pathname.startsWith("/app/")) return LEGACY_GAME_CSP;
  if (pathname === "/login" || pathname.startsWith("/login/") || pathname.startsWith("/auth/vk/")) return AUTH_CSP;
  return STRICT_CSP;
}

function securedResponse(response, pathname) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  headers.set("Content-Security-Policy", contentSecurityPolicy(pathname));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (context.env.DB) await ensureRuntimeMigrations(context.env.DB);
  const isApi = url.pathname.startsWith("/api/");
  let session = null;
  let security = null;
  if (isApi && context.env.DB) {
    session = await getSession(context.env.DB, context.request);
    security = await enforceApiSecurity(context, session);
    if (security.response) return securedResponse(security.response, url.pathname);
  }
  const isGameEntry = url.pathname === "/app" || url.pathname === "/app/" || url.pathname === "/app/index.html";
  const isProfileSetup = url.pathname === "/setup-profile" || url.pathname === "/setup-profile/" || url.pathname === "/setup-profile/index.html";
  const isProtectedEntry = isGameEntry || isProfileSetup;
  if (isProtectedEntry) {
    if (!context.env.DB) {
      return securedResponse(new Response("Database is not configured", { status: 503 }), url.pathname);
    }

    session ||= await getSession(context.env.DB, context.request);
    if (!session) {
      return securedResponse(Response.redirect(`${url.origin}/login/`, 302), url.pathname);
    }
    const legal = await legalStatus(context.env.DB, session.id);
    if (!legal.requiredAccepted) {
      return securedResponse(Response.redirect(`${url.origin}/login/?legal=required`, 302), url.pathname);
    }
    if (!session.nickname) {
      return securedResponse(Response.redirect(`${url.origin}/setup-profile/`, 302), url.pathname);
    }
  }

  const response = await context.next();
  if (isApi && security) {
    try {
      await recordSuspiciousResponse(context, session, security.audit, response.status);
    } catch (error) {
      console.error("Security audit write failed", error);
    }
  }
  return securedResponse(response, url.pathname);
}
