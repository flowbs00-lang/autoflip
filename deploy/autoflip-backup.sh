#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

database="${DATABASE_PATH:-/var/lib/autoflip/autoflip.sqlite3}"
backup_directory="${BACKUP_DIRECTORY:-/var/backups/autoflip}"
retention_days="${RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
database_copy="${backup_directory}/.autoflip-${timestamp}.sqlite3.tmp"
archive_tmp="${backup_directory}/.autoflip-${timestamp}.sqlite3.gz.tmp"
archive="${backup_directory}/autoflip-${timestamp}.sqlite3.gz"

cleanup() {
  rm -f -- "$database_copy" "$archive_tmp"
}
trap cleanup EXIT

if [[ ! -f "$database" ]]; then
  echo "Database not found: $database" >&2
  exit 1
fi
if [[ ! "$retention_days" =~ ^[0-9]+$ ]] || (( retention_days < 1 )); then
  echo "RETENTION_DAYS must be a positive integer" >&2
  exit 1
fi

install -d -o root -g root -m 0700 "$backup_directory"

# SQLite's online backup command produces a consistent snapshot even when the
# application is writing through WAL mode.
/usr/bin/sqlite3 "$database" ".timeout 10000" ".backup '${database_copy}'"

integrity="$(/usr/bin/sqlite3 "$database_copy" "PRAGMA integrity_check;")"
if [[ "$integrity" != "ok" ]]; then
  echo "Backup integrity check failed: $integrity" >&2
  exit 1
fi

foreign_key_errors="$(/usr/bin/sqlite3 "$database_copy" "PRAGMA foreign_key_check;")"
if [[ -n "$foreign_key_errors" ]]; then
  echo "Backup foreign-key check failed" >&2
  printf '%s\n' "$foreign_key_errors" >&2
  exit 1
fi

/usr/bin/gzip -9 -c "$database_copy" > "$archive_tmp"
mv -- "$archive_tmp" "$archive"
/usr/bin/sha256sum "$archive" > "${archive}.sha256"
chmod 0600 "$archive" "${archive}.sha256"

find "$backup_directory" -maxdepth 1 -type f \
  \( -name 'autoflip-*.sqlite3.gz' -o -name 'autoflip-*.sqlite3.gz.sha256' \) \
  -mtime "+${retention_days}" -delete

echo "Backup created: $archive"
