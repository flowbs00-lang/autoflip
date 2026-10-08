ALTER TABLE clan_members ADD COLUMN role TEXT NOT NULL DEFAULT 'member';

CREATE TRIGGER IF NOT EXISTS clan_members_limit
BEFORE INSERT ON clan_members
WHEN (SELECT COUNT(*) FROM clan_members WHERE clan_id = NEW.clan_id) >= 50
BEGIN
  SELECT RAISE(ABORT, 'clan_full');
END;
