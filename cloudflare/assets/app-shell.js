(() => {
  "use strict";
  const profile = document.querySelector("#profile");
  const logout = document.querySelector("#logout");
  const status = document.querySelector("#status");

  async function loadProfile() {
    const response = await fetch("/api/session", { credentials: "same-origin" });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.authenticated) return location.replace("/login/");
    if (result.needsNickname) return location.replace("/setup-profile/");
    profile.textContent = `${result.user.nickname} · ID ${result.user.id}`;
  }

  logout.addEventListener("click", async () => {
    logout.disabled = true;
    status.textContent = "Завершаем сессию…";
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => null);
    location.replace("/login/");
  });

  loadProfile().catch(() => location.replace("/login/"));
})();
