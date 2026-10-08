(() => {
  "use strict";

  const APP_ID = 54810634;
  const CALLBACK_URL = "https://autoflip.pages.dev/auth/vk/callback";
  const status = document.querySelector("#status");
  const VKID = window.VKIDSDK;

  function fail(message) {
    status.textContent = message;
    status.className = "status error";
    setTimeout(() => location.replace("/login/"), 3500);
  }

  function callbackParams() {
    const query = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/u, ""));
    return query.size ? query : hash;
  }

  async function complete() {
    const params = callbackParams();
    const code = params.get("code") || "";
    const deviceId = params.get("device_id") || "";
    const returnedState = params.get("state") || "";
    const expectedState = sessionStorage.getItem("autoflip.vk.state") || "";
    const codeVerifier = sessionStorage.getItem("autoflip.vk.verifier") || "";

    if (!VKID || !code || !deviceId || !expectedState || returnedState !== expectedState || !codeVerifier) {
      fail("Ответ VK ID не прошёл проверку. Возвращаем на страницу входа…");
      return;
    }

    try {
      VKID.Config.init({
        app: APP_ID,
        redirectUrl: CALLBACK_URL,
        state: expectedState,
        codeVerifier,
        scope: ""
      });

      const tokens = await VKID.Auth.exchangeCode(code, deviceId, codeVerifier);
      const response = await fetch("/api/auth/vk", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: tokens.access_token })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "server_error");

      sessionStorage.removeItem("autoflip.vk.state");
      sessionStorage.removeItem("autoflip.vk.verifier");
      location.replace(result.needsNickname ? "/setup-profile/" : "/app/");
    } catch (error) {
      console.error(error);
      fail("Не удалось завершить вход. Попробуйте ещё раз…");
    }
  }

  complete();
})();
