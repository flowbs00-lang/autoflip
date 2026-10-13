export async function deleteAccountData(db, userId) {
  const accountSubject = `account:${userId}`;
  await db.batch([
    db.prepare("DELETE FROM security_rate_windows WHERE subject = ?").bind(accountSubject),
    db.prepare("DELETE FROM security_blocks WHERE subject = ?").bind(accountSubject),
    db.prepare("DELETE FROM security_events WHERE subject = ? OR user_id = ?").bind(accountSubject, userId),
    db.prepare("UPDATE community_messages SET deleted_by = NULL WHERE deleted_by = ?").bind(userId),
    db.prepare("UPDATE community_reports SET reviewed_by = NULL WHERE reviewed_by = ?").bind(userId),
    db.prepare("UPDATE community_bans SET created_by = 'deleted-account' WHERE created_by = ?").bind(userId),
    db.prepare("UPDATE community_moderation_log SET admin_user_id = 'deleted-account' WHERE admin_user_id = ?").bind(userId),
    db.prepare("UPDATE community_moderation_log SET target_user_id = NULL WHERE target_user_id = ?").bind(userId),
    db.prepare("UPDATE support_tickets SET reviewed_by = NULL WHERE reviewed_by = ?").bind(userId),
    db.prepare("UPDATE store_refund_requests SET reviewed_by = NULL WHERE reviewed_by = ?").bind(userId),
    db.prepare("DELETE FROM users WHERE id = ?").bind(userId)
  ]);
}
