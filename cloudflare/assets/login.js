(() => {
  "use strict";

  const APP_ID = 54810634;
  const CALLBACK_URL = "https://autoflip.pages.dev/auth/vk/callback";
  const button = document.querySelector("#vk-login");
  const status = document.querySelector("#status");
  const VKID = window.VKIDSDK;

  function randomUrlSafe(length = 32) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  }

  function show(message, type = "") {
    status.textContent = message;
    status.className = `status ${type}`.trim();
  }

  async function startLogin() {
    if (!VKID) {
      show("Не удалось загрузить VK ID. Проверьте соединение и попробуйте ещё раз.", "error");
      return;
    }

    button.disabled = true;
    show("Открываем защищённый вход VK ID…");

    const state = randomUrlSafe(24);
    const codeVerifier = randomUrlSafe(48);
    sessionStorage.setItem("autoflip.vk.state", state);
    sessionStorage.setItem("autoflip.vk.verifier", codeVerifier);

    try {
      VKID.Config.init({
        app: APP_ID,
        redirectUrl: CALLBACK_URL,
        state,
        codeVerifier,
        scope: ""
      });
      await VKID.Auth.login();
    } catch (error) {
      console.error(error);
      button.disabled = false;
      show("Вход не начался. Попробуйте ещё раз.", "error");
    }
  }

  async function restoreSession() {
    try {
      const response = await fetch("/api/session", { credentials: "same-origin" });
      if (!response.ok) return;
      const result = await response.json();
      if (!result.authenticated) return;
      location.replace(result.needsNickname ? "/setup-profile/" : "/app/");
    } catch {
      // The login button remains available if the session check is unavailable.
    }
  }

  button.addEventListener("click", startLogin);
  restoreSession();
})();
