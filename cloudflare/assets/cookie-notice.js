(() => {
  "use strict";

  const storageKey = "autoflip-cookie-notice-v1";
  try {
    if (localStorage.getItem(storageKey) === "acknowledged") return;
  } catch (_) {}

  const notice = document.createElement("section");
  notice.className = "cookie-notice";
  notice.setAttribute("role", "region");
  notice.setAttribute("aria-label", "Уведомление об использовании cookies");
  notice.innerHTML = `
    <div class="cookie-notice__copy">
      <strong class="cookie-notice__title">Необходимые cookies и данные на устройстве</strong>
      <p class="cookie-notice__text">AutoFlip использует техническую cookie для безопасного входа и локальное хранилище для настроек, синхронизации и резервной копии игры. Рекламных cookies нет. <a href="/legal/privacy/#cookies">Подробнее в политике</a>.</p>
    </div>
    <button class="cookie-notice__button" type="button">Понятно</button>`;

  notice.querySelector("button").addEventListener("click", () => {
    try { localStorage.setItem(storageKey, "acknowledged"); } catch (_) {}
    notice.hidden = true;
  });

  document.body.appendChild(notice);
})();
