ALTER TABLE plate_case_openings ADD COLUMN reward_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS plate_case_openings_reward_idx
  ON plate_case_openings(user_id, reward_key) WHERE reward_key IS NOT NULL;
