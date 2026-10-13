const DAY = 24 * 60 * 60_000;

export const RETENTION = Object.freeze({
  backups: 30 * DAY,
  messages: 90 * DAY,
  moderation: 365 * DAY,
  support: 365 * DAY,
  securityWindows: 7 * DAY,
  securityEvents: 30 * DAY,
  maintenanceRuns: 90 * DAY
});

export function cleanupStatements(db, now) {
  const nowSeconds = Math.floor(now / 1000);
  return [
    ["expiredSessions", db.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(nowSeconds)],
    ["expiredBackups", db.prepare("DELETE FROM game_save_backups WHERE created_at < ?").bind(now - RETENTION.backups)],
    ["excessBackups", db.prepare(`DELETE FROM game_save_backups AS candidate
      WHERE (SELECT COUNT(*) FROM game_save_backups AS newer
        WHERE newer.user_id = candidate.user_id AND newer.revision > candidate.revision) >= 5`)],
    ["expiredMessages", db.prepare("DELETE FROM community_messages WHERE created_at < ?").bind(now - RETENTION.messages)],
    ["expiredModeration", db.prepare("DELETE FROM community_moderation_log WHERE created_at < ?").bind(now - RETENTION.moderation)],
    ["expiredSupport", db.prepare("DELETE FROM support_tickets WHERE status IN ('resolved', 'closed') AND updated_at < ?").bind(now - RETENTION.support)],
    ["expiredSecurityWindows", db.prepare("DELETE FROM security_rate_windows WHERE updated_at < ?").bind(now - RETENTION.securityWindows)],
    ["expiredSecurityEvents", db.prepare("DELETE FROM security_events WHERE created_at < ?").bind(now - RETENTION.securityEvents)],
    ["expiredSecurityBlocks", db.prepare("DELETE FROM security_blocks WHERE expires_at <= ?").bind(now)],
    ["expiredCommunityBans", db.prepare("DELETE FROM community_bans WHERE expires_at IS NOT NULL AND expires_at <= ?").bind(now)],
    ["oldMaintenanceRuns", db.prepare("DELETE FROM retention_maintenance_runs WHERE finished_at IS NOT NULL AND finished_at < ?").bind(now - RETENTION.maintenanceRuns)]
  ];
}

function changes(result) {
  return Number(result?.meta?.changes || 0);
}

export async function ensureMaintenanceSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS retention_maintenance_runs (
    id TEXT PRIMARY KEY,
    scheduled_at INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    status TEXT NOT NULL,
    details_json TEXT NOT NULL DEFAULT '{}',
    error TEXT NOT NULL DEFAULT ''
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS retention_maintenance_runs_started_idx ON retention_maintenance_runs(started_at DESC)").run();
}

export async function runRetentionCleanup(db, { now = Date.now(), scheduledAt = now, runId = crypto.randomUUID() } = {}) {
  await ensureMaintenanceSchema(db);
  await db.prepare(`INSERT INTO retention_maintenance_runs
    (id, scheduled_at, started_at, status) VALUES (?, ?, ?, 'running')`)
    .bind(runId, scheduledAt, now)
    .run();

  const entries = cleanupStatements(db, now);
  try {
    const results = await db.batch(entries.map(([, statement]) => statement));
    const deleted = Object.fromEntries(entries.map(([name], index) => [name, changes(results[index])]));
    const finishedAt = Date.now();
    await db.prepare(`UPDATE retention_maintenance_runs
      SET finished_at = ?, status = 'succeeded', details_json = ? WHERE id = ?`)
      .bind(finishedAt, JSON.stringify({ deleted }), runId)
      .run();
    return { runId, deleted, finishedAt };
  } catch (error) {
    const finishedAt = Date.now();
    const message = String(error?.message || error).slice(0, 1000);
    try {
      await db.prepare(`UPDATE retention_maintenance_runs
        SET finished_at = ?, status = 'failed', error = ? WHERE id = ?`)
        .bind(finishedAt, message, runId)
        .run();
    } catch (logError) {
      console.error("retention_cleanup_failure_log_failed", logError);
    }
    throw error;
  }
}
