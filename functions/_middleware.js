import { getSession } from "./_lib/session.js";

const SECURITY_HEADERS = Object.freeze({
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()"
});

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isGameEntry = url.pathname === "/app" || url.pathname === "/app/" || url.pathname === "/app/index.html";
  if (isGameEntry) {
    if (!context.env.DB) {
      return new Response("Database is not configured", { status: 503 });
    }

    const session = await getSession(context.env.DB, context.request);
    if (!session) {
      return Response.redirect(`${url.origin}/login/`, 302);
    }
    if (!session.nickname) {
      return Response.redirect(`${url.origin}/setup-profile/`, 302);
    }
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
