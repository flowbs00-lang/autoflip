(() => {
  "use strict";
  const form = document.querySelector("#nickname-form");
  const input = document.querySelector("#nickname");
  const submit = document.querySelector("#submit");
  const status = document.querySelector("#status");

  const messages = {
    invalid_nickname: "Используйте 3–20 букв или цифр. Подчёркивание — только между словами.",
    nickname_taken: "Этот никнейм уже занят. Попробуйте другой.",
    nickname_reserved: "Этот никнейм зарезервирован. Попробуйте другой.",
    authentication_required: "Сессия закончилась. Войдите ещё раз."
  };

  async function verifySession() {
    const response = await fetch("/api/session", { credentials: "same-origin" });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.authenticated) location.replace("/login/");
    else if (!result.needsNickname) location.replace("/app/");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    status.className = "status";
    status.textContent = "Проверяем никнейм…";

    try {
      const response = await fetch("/api/profile/nickname", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: input.value })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "server_error");
      status.className = "status success";
      status.textContent = "Профиль создан. Открываем AutoFlip…";
      location.replace("/app/");
    } catch (error) {
      status.className = "status error";
      status.textContent = messages[error.message] || "Не удалось сохранить никнейм. Попробуйте ещё раз.";
      submit.disabled = false;
      input.focus();
    }
  });

  verifySession().catch(() => location.replace("/login/"));
})();
