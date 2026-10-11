export const OWNER_PLAYER_ID = "AF-VH8KEHQ3GRCC";

export function isAdminUser(env, userId) {
  const configured = String(env?.ADMIN_PLAYER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return userId === OWNER_PLAYER_ID || configured.includes(String(userId || ""));
}
