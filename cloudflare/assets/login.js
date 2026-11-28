(() => {
  "use strict";

  const APP_ID = 54810634;
  const CALLBACK_URL = "https://autoflip-game.ru/auth/vk/callback";
  const PENDING_LOGIN_KEY = "autoflip.vk.pending";
  const status = document.querySelector("#status");
  const submit = document.querySelector("#auth-submit");
  const guest = document.querySelector("#guest-login");
  const vkButton = document.querySelector("#vk-login");
  const passwordForm = document.querySelector("#password-form");
  const recoveryForm = document.querySelector("#recovery-form");
  const consents = document.querySelector("#auth-consents");
  const recoveryResult = document.querySelector("#recovery-result");
  const VKID = window.VKIDSDK;
  const VERSIONS = Object.freeze({
    terms: "2026-11-28",
    personalData: "2026-11-28.1",
    communityRules: "2026-10-12",
    publicProfile: "2026-10-12"
  });
  const ERRORS = Object.freeze({
    invalid_credentials: "Неверный никнейм или пароль.",
    invalid_username: "Никнейм: от 3 до 20 букв или цифр; между словами можно использовать подчёркивание.",
    username_reserved: "Этот никнейм зарезервирован.",
    username_taken: "Этот никнейм уже занят.",
    invalid_password: "Пароль должен содержать от 10 до 128 символов.",
    invalid_recovery: "ID игрока или код восстановления не подошёл.",
    legal_consent_required: "Отметьте три обязательных согласия.",
    closed_beta_only: "Создание новых аккаунтов временно закрыто.",
    rate_limited: "Слишком много попыток. Подождите и попробуйте позже.",
    temporarily_blocked: "Вход временно ограничен. Попробуйте позже."
  });
  let mode = "login";
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

  function setBusy(value) {
    submit.disabled = value;
    guest.disabled = value;
    if (vkButton) vkButton.disabled = value;
  }

  function setMode(next) {
    mode = next;
    recoveryResult.hidden = true;
    passwordForm.hidden = next === "recover" || next === "consent";
    recoveryForm.hidden = next !== "recover";
    consents.hidden = next !== "register" && next !== "consent";
    guest.hidden = next === "recover" || next === "consent";
    document.querySelector("#confirm-field").hidden = next !== "register";
    document.querySelector("#auth-password").autocomplete = next === "register" ? "new-password" : "current-password";
    document.querySelector("#password-hint").textContent = next === "register"
      ? "Минимум 10 символов. После регистрации сохраните код восстановления."
      : "Введите никнейм и пароль.";
    submit.textContent = next === "register" ? "Создать аккаунт" : next === "recover" ? "Восстановить аккаунт" : next === "consent" ? "Принять и продолжить" : "Войти";
    for (const name of ["login", "register", "recover"]) {
      const tab = document.querySelector(`#mode-${name}`);
      tab.classList.toggle("active", name === next);
      tab.setAttribute("aria-selected", String(name === next));
      tab.disabled = next === "consent";
    }
    show("");
  }

  async function api(path, body) {
    const response = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      const error = new Error(result?.error || "request_failed");
      error.code = result?.error || "request_failed";
      throw error;
    }
    return result;
  }

  async function currentSession() {
    const response = await fetch("/api/session", { credentials: "same-origin", cache: "no-store" });
    return response.ok ? response.json() : null;
  }

  function destination(session) {
    if (session?.needsLegalConsent) return "/login/?legal=required";
    if (session?.needsNickname) return "/setup-profile/";
    if (session?.needsCredentials) return "/setup-account/";
    return "/app/";
  }

  function revealRecovery(code) {
    document.querySelector("#issued-recovery-code").textContent = code;
    passwordForm.hidden = true;
    recoveryForm.hidden = true;
    consents.hidden = true;
    submit.hidden = true;
    guest.hidden = true;
    recoveryResult.hidden = false;
    document.querySelector(".auth-tabs").hidden = true;
    document.querySelector(".legacy-login").hidden = true;
    show("Код показывается только сейчас.", "success");
  }

  async function continueToGame() {
    const session = await currentSession();
    location.replace(destination(session));
  }

  async function submitPasswordFlow() {
    if (mode === "consent") {
      const legal = legalAcceptance();
      if (!requiredAccepted(legal)) return show(ERRORS.legal_consent_required, "error");
      setBusy(true);
      try {
        await api("/api/legal/consents", { legal });
        location.replace(destination({ ...authenticatedSession, needsLegalConsent: false }));
      } catch (error) {
        show(ERRORS[error.code] || "Не удалось сохранить согласия.", "error");
        setBusy(false);
      }
      return;
    }

    if (mode === "recover") {
      setBusy(true);
      try {
        const result = await api("/api/auth/recover", {
          playerId: document.querySelector("#recovery-player").value,
          recoveryCode: document.querySelector("#recovery-code").value,
          username: document.querySelector("#recovery-username").value,
          password: document.querySelector("#recovery-password").value
        });
        revealRecovery(result.recoveryCode);
      } catch (error) {
        show(ERRORS[error.code] || "Не удалось восстановить аккаунт.", "error");
        setBusy(false);
      }
      return;
    }

    const username = document.querySelector("#auth-username").value;
    const password = document.querySelector("#auth-password").value;
    if (mode === "register" && password !== document.querySelector("#auth-confirm").value) {
      return show("Пароли не совпадают.", "error");
    }
    const legal = legalAcceptance();
    if (mode === "register" && !requiredAccepted(legal)) return show(ERRORS.legal_consent_required, "error");
    setBusy(true);
    try {
      const result = await api(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
        username,
        password,
        legal: mode === "register" ? legal : undefined
      });
      if (result.recoveryCode) return revealRecovery(result.recoveryCode);
      await continueToGame();
    } catch (error) {
      show(ERRORS[error.code] || "Не удалось войти. Проверьте соединение и попробуйте ещё раз.", "error");
      setBusy(false);
    }
  }

  async function startGuest() {
    if (mode !== "register") {
      setMode("register");
      show("Для гостевого аккаунта подтвердите обязательные документы и нажмите «Играть без регистрации» ещё раз.");
      return;
    }
    const legal = legalAcceptance();
    if (!requiredAccepted(legal)) return show(ERRORS.legal_consent_required, "error");
    setBusy(true);
    try {
      const result = await api("/api/auth/guest", { legal });
      revealRecovery(result.recoveryCode);
    } catch (error) {
      show(ERRORS[error.code] || "Не удалось создать гостевой аккаунт.", "error");
      setBusy(false);
    }
  }

  function rememberPendingLogin(state, codeVerifier, legal) {
    const pending = JSON.stringify({ state, codeVerifier, legal, createdAt: Date.now() });
    sessionStorage.setItem("autoflip.vk.state", state);
    sessionStorage.setItem("autoflip.vk.verifier", codeVerifier);
    sessionStorage.setItem("autoflip.legal", JSON.stringify(legal));
    try { localStorage.setItem(PENDING_LOGIN_KEY, pending); } catch (_) {}
  }

  async function startLegacyVkLogin() {
    const legal = legalAcceptance();
    if (!requiredAccepted(legal)) {
      setMode("register");
      show("Для переноса старого аккаунта подтвердите обязательные документы, затем снова нажмите кнопку VK.", "error");
      return;
    }
    if (!VKID) return show("Не удалось загрузить VK ID.", "error");
    setBusy(true);
    show("Открываем старый аккаунт VK ID…");
    const state = randomUrlSafe(24);
    const codeVerifier = randomUrlSafe(48);
    rememberPendingLogin(state, codeVerifier, legal);
    let openingTimeout;
    try {
      VKID.Config.init({ app: APP_ID, redirectUrl: CALLBACK_URL, state, codeVerifier, mode: VKID.ConfigAuthMode.Redirect, responseMode: VKID.ConfigResponseMode.Redirect, scope: "" });
      openingTimeout = setTimeout(() => {
        setBusy(false);
        show("VK ID не открылся. Используйте этот способ только для переноса старого аккаунта.", "error");
      }, 8_000);
      await VKID.Auth.login();
      clearTimeout(openingTimeout);
    } catch (error) {
      clearTimeout(openingTimeout);
      console.error(error);
      setBusy(false);
      show("Вход через VK не начался. Попробуйте ещё раз.", "error");
    }
  }

  async function restoreSession() {
    try {
      const result = await currentSession();
      if (!result?.authenticated) return;
      if (!result.needsLegalConsent) return location.replace(destination(result));
      authenticatedSession = result;
      setMode("consent");
      show("Перед продолжением подтвердите актуальные документы.");
    } catch {
      // The normal login form remains available.
    }
  }

  document.querySelector("#mode-login").addEventListener("click", () => setMode("login"));
  document.querySelector("#mode-register").addEventListener("click", () => setMode("register"));
  document.querySelector("#mode-recover").addEventListener("click", () => setMode("recover"));
  submit.addEventListener("click", submitPasswordFlow);
  guest.addEventListener("click", startGuest);
  vkButton.addEventListener("click", startLegacyVkLogin);
  document.querySelector("#copy-recovery").addEventListener("click", async () => {
    const code = document.querySelector("#issued-recovery-code").textContent;
    try { await navigator.clipboard.writeText(code); show("Код скопирован.", "success"); }
    catch { show(`Сохраните код: ${code}`, "success"); }
  });
  document.querySelector("#continue-after-recovery").addEventListener("click", continueToGame);
  setMode("login");
  restoreSession();
})();
