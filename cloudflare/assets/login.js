(() => {
  "use strict";

  const APP_ID = 54810634;
  const CALLBACK_URL = "https://autoflip.pages.dev/auth/vk/callback";
  const button = document.querySelector("#vk-login");
  const status = document.querySelector("#status");
  const VKID = window.VKIDSDK;
  const VERSION = "2026-10-12";
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
      terms: { accepted: document.querySelector("#consent-terms").checked, version: VERSION },
      personalData: { accepted: document.querySelector("#consent-personal").checked, version: VERSION },
      communityRules: { accepted: document.querySelector("#consent-community").checked, version: VERSION },
      publicProfile: { accepted: document.querySelector("#consent-profile").checked, version: VERSION }
    };
  }

  function requiredAccepted(legal) {
    return legal.terms.accepted && legal.personalData.accepted && legal.communityRules.accepted;
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
    sessionStorage.setItem("autoflip.vk.state", state);
    sessionStorage.setItem("autoflip.vk.verifier", codeVerifier);
    sessionStorage.setItem("autoflip.legal", JSON.stringify(legal));

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
