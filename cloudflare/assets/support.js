(() => {
  "use strict";
  const status = document.querySelector("#status");
  const tickets = document.querySelector("#tickets");

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
  }

  async function request(method, body) {
    const response = await fetch("/api/support", {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "request_failed");
      error.retryAfter = Number(data.retryAfter || response.headers.get("Retry-After") || 0);
      throw error;
    }
    return data;
  }

  function render(data) {
    if (!data.tickets.length) {
      tickets.innerHTML = "<p>Обращений пока нет.</p>";
      return;
    }
    tickets.innerHTML = data.tickets.map((ticket) => `<article class="ticket"><b>${esc(ticket.subject)}</b><small>${new Date(ticket.createdAt).toLocaleString("ru-RU")} · ${esc(ticket.status)}${data.admin && ticket.nickname ? ` · ${esc(ticket.nickname)} (${esc(ticket.userId)})` : ""}</small><small>${esc(ticket.message)}</small>${ticket.response ? `<span>Ответ: ${esc(ticket.response)}</span>` : ""}${data.admin && ticket.status === "open" ? `<button class="button secondary" data-id="${esc(ticket.id)}">Ответить и закрыть</button>` : ""}</article>`).join("");
    for (const button of tickets.querySelectorAll("button[data-id]")) {
      button.addEventListener("click", async () => {
        const response = prompt("Ответ пользователю:");
        if (!response) return;
        await request("POST", { action: "review", ticketId: button.dataset.id, status: "resolved", response });
        await load();
      });
    }
  }

  async function load() {
    try {
      render(await request("GET"));
    } catch (error) {
      tickets.innerHTML = error.message === "authentication_required"
        ? "<p>Войдите в аккаунт, чтобы отправлять и видеть обращения.</p>"
        : "<p>Не удалось загрузить обращения.</p>";
    }
  }

  document.querySelector("#send").addEventListener("click", async () => {
    status.textContent = "Отправляем…";
    try {
      await request("POST", {
        category: document.querySelector("#category").value,
        subject: document.querySelector("#subject").value,
        message: document.querySelector("#message").value
      });
      status.textContent = "Обращение отправлено.";
      document.querySelector("#subject").value = "";
      document.querySelector("#message").value = "";
      await load();
    } catch (error) {
      if (error.message === "authentication_required") status.textContent = "Сначала войдите в аккаунт.";
      else if (["support_rate_limited", "rate_limited", "temporarily_blocked"].includes(error.message)) status.textContent = "Слишком много обращений. Попробуйте позже.";
      else status.textContent = "Проверьте заполнение и попробуйте снова.";
    }
  });

  load();
})();
