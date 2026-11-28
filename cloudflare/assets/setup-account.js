(() => {
  "use strict";
  const form = document.querySelector("#credentials-form");
  const button = document.querySelector("#save-credentials");
  const status = document.querySelector("#status");
  const result = document.querySelector("#setup-recovery-result");
  const messages = {
    invalid_username: "Никнейм: от 3 до 20 букв или цифр; между словами можно использовать подчёркивание.",
    username_reserved: "Этот никнейм зарезервирован.",
    username_taken: "Этот никнейм уже занят.",
    invalid_password: "Пароль должен содержать от 10 до 128 символов.",
    authentication_required: "Сессия закончилась. Войдите в старый аккаунт ещё раз."
  };

  function show(message, type = "") {
    status.textContent = message;
    status.className = `status ${type}`.trim();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;
    if (password !== document.querySelector("#confirm").value) return show("Пароли не совпадают.", "error");
    button.disabled = true;
    show("Создаём новый вход…");
    try {
      const response = await fetch("/api/auth/credentials", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        const error = new Error(payload?.error || "request_failed");
        error.code = payload?.error;
        throw error;
      }
      document.querySelector("#setup-recovery-code").textContent = payload.recoveryCode;
      form.hidden = true;
      result.hidden = false;
      show("Новый вход привязан к существующему прогрессу.", "success");
    } catch (error) {
      show(messages[error.code] || "Не удалось сохранить новый вход. Попробуйте ещё раз.", "error");
      button.disabled = false;
    }
  });

  document.querySelector("#setup-copy-code").addEventListener("click", async () => {
    const code = document.querySelector("#setup-recovery-code").textContent;
    try { await navigator.clipboard.writeText(code); show("Код скопирован.", "success"); }
    catch { show(`Сохраните код: ${code}`, "success"); }
  });
  document.querySelector("#setup-continue").addEventListener("click", () => location.replace("/app/"));
})();
