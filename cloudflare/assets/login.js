(() => {
  "use strict";

  const APP_ID = 54810634;
  const CALLBACK_URL = "https://autoflip-game.ru/auth/vk/callback";
  const PENDING_LOGIN_KEY = "autoflip.vk.pending";
  const button = document.querySelector("#vk-login");
  const status = document.querySelector("#status");
  const VKID = window.VKIDSDK;
  const VERSIONS = Object.freeze({
    terms: "2026-10-12",
    personalData: "2026-10-12.1",
    communityRules: "2026-10-12",
    publicProfile: "2026-10-12"
  });
  let authenticatedSession = null;

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

  function legalAcceptance() {
    return {
      terms: { accepted: document.querySelector("#consent-terms").checked, version: VERSIONS.terms },
      personalData: { accepted: document.querySelector("#consent-personal").checked, version: VERSIONS.personalData },
      communityRules: { accepted: document.querySelector("#consent-community").checked, version: VERSIONS.communityRules },
      publicProfile: { accepted: document.querySelector("#consent-profile").checked, version: VERSIONS.publicProfile }
    };
  }

  function requiredAccepted(legal) {
    return legal.terms.accepted && legal.personalData.accepted && legal.communityRules.accepted;
  }

  function rememberPendingLogin(state, codeVerifier, legal) {
    const pending = JSON.stringify({ state, codeVerifier, legal, createdAt: Date.now() });
    sessionStorage.setItem("autoflip.vk.state", state);
    sessionStorage.setItem("autoflip.vk.verifier", codeVerifier);
    sessionStorage.setItem("autoflip.legal", JSON.stringify(legal));
    // VK ID can return mobile users in a newly created browser tab. In that
    // case sessionStorage is empty, so keep the same short-lived PKCE payload
    // as a fallback. The callback deletes it immediately after use.
    try { localStorage.setItem(PENDING_LOGIN_KEY, pending); } catch (_) {}
  }

  async function acceptForCurrentSession(legal) {
    const response = await fetch("/api/legal/consents", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legal })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) throw new Error(result?.error || "consent_failed");
    location.replace(authenticatedSession.needsNickname ? "/setup-profile/" : "/app/");
  }

  async function startLogin() {
    const legal = legalAcceptance();
    if (!requiredAccepted(legal)) {
      show("Отметьте три обязательных согласия. Разрешение на публичный профиль остаётся добровольным.", "error");
      return;
    }

    if (authenticatedSession) {
      button.disabled = true;
      show("Сохраняем ваш выбор…");
      try {
        await acceptForCurrentSession(legal);
      } catch (error) {
        console.error(error);
        button.disabled = false;
        show("Не удалось сохранить согласия. Попробуйте ещё раз.", "error");
      }
      return;
    }

    if (!VKID) {
      show("Не удалось загрузить VK ID. Проверьте соединение и попробуйте ещё раз.", "error");
      return;
    }

    button.disabled = true;
    show("Открываем защищённый вход VK ID…");

    const state = randomUrlSafe(24);
    const codeVerifier = randomUrlSafe(48);
    rememberPendingLogin(state, codeVerifier, legal);

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
      if (!result.needsLegalConsent) {
        location.replace(result.needsNickname ? "/setup-profile/" : "/app/");
        return;
      }
      authenticatedSession = result;
      button.querySelector("span:last-child").textContent = "Принять и продолжить";
      show("Перед продолжением подтвердите актуальные документы.");
    } catch {
      // The login button remains available if the session check is unavailable.
    }
  }

  button.addEventListener("click", startLogin);
  restoreSession();
})();
