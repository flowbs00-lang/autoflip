const SECURITY_HEADERS = Object.freeze({
  "Content-Security-Policy": [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "img-src 'self' data:",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'"
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive"
});

function response(body, init = {}) {
  const headers = new Headers(init.headers);

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  return new Response(body, { ...init, headers });
}

function renderSetupPage() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="dark">
  <title>AutoFlip — настройка входа</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: 24px; color: #eef3ff; background: radial-gradient(circle at 20% 0%, #203766 0, transparent 38%), #080d18; }
    main { width: min(100%, 580px); padding: clamp(24px, 6vw, 44px); border: 1px solid #2c3952; border-radius: 28px; background: rgba(15, 23, 40, .92); box-shadow: 0 28px 80px rgba(0, 0, 0, .45); }
    .badge { display: inline-flex; padding: 7px 11px; border: 1px solid #365486; border-radius: 999px; color: #a9c7ff; background: #142441; font-size: 13px; font-weight: 700; }
    h1 { margin: 20px 0 12px; font-size: clamp(30px, 8vw, 48px); line-height: 1.03; letter-spacing: -.04em; }
    p { margin: 0; color: #b8c4d9; font-size: 17px; line-height: 1.6; }
    .status { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: center; margin-top: 28px; padding: 16px; border-radius: 18px; color: #dce8ff; background: #111d32; }
    .dot { width: 12px; height: 12px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 6px rgba(74, 222, 128, .12); }
    small { display: block; margin-top: 22px; color: #75839b; line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <span class="badge">Закрытая разработка</span>
    <h1>Cloudflare подключён</h1>
    <p>Это безопасная служебная страница. Сама игра и данные игроков сюда пока не загружены. Следующий этап — привязать VK ID к этому адресу и только затем перенести авторизацию.</p>
    <div class="status"><span class="dot" aria-hidden="true"></span><strong>Тестовый Worker работает</strong></div>
    <small>Страница запрещена для индексации. Не вводите здесь пароли, токены или секретные ключи.</small>
  </main>
</body>
</html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    if (url.pathname === "/health") {
      return response(JSON.stringify({ ok: true, service: "autoflip-vk-auth-bootstrap" }), {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8"
        }
      });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return response(request.method === "HEAD" ? null : renderSetupPage(), {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    }

    return response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};
