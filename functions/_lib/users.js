const PLAYER_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomPlayerId() {
  const random = crypto.getRandomValues(new Uint8Array(12));
  let id = "AF-";
  for (const byte of random) id += PLAYER_ID_ALPHABET[byte % PLAYER_ID_ALPHABET.length];
  return id;
}

export async function upsertVkUser(db, vkUser) {
  const vkUserId = String(vkUser.user_id || "");
  if (!/^\d{1,24}$/u.test(vkUserId)) throw new Error("Invalid VK user id");

  const existing = await db.prepare("SELECT id FROM users WHERE vk_user_id = ? LIMIT 1")
    .bind(vkUserId)
    .first();
  const now = Math.floor(Date.now() / 1000);

  if (existing) {
    await db.prepare(`
      UPDATE users
      SET first_name = ?, last_name = ?, avatar_url = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      String(vkUser.first_name || "").slice(0, 100),
      String(vkUser.last_name || "").slice(0, 100),
      String(vkUser.avatar || "").slice(0, 500),
      now,
      existing.id
    ).run();
    return existing.id;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = randomPlayerId();
    try {
      await db.prepare(`
        INSERT INTO users (
          id, vk_user_id, nickname, first_name, last_name, avatar_url, created_at, updated_at
        ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)
      `).bind(
        id,
        vkUserId,
        String(vkUser.first_name || "").slice(0, 100),
        String(vkUser.last_name || "").slice(0, 100),
        String(vkUser.avatar || "").slice(0, 500),
        now,
        now
      ).run();
      return id;
    } catch (error) {
      const raced = await db.prepare("SELECT id FROM users WHERE vk_user_id = ? LIMIT 1")
        .bind(vkUserId)
        .first();
      if (raced) return raced.id;
      if (attempt === 2) throw error;
    }
  }

  throw new Error("Could not create player");
}

export function publicUser(row) {
  return {
    id: row.id,
    nickname: row.nickname || null,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    avatarUrl: row.avatar_url || ""
  };
}
