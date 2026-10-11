import { RequestError } from "./http.js";

export const LEGAL_VERSIONS = Object.freeze({
  terms: "2026-10-11",
  personalData: "2026-10-11",
  communityRules: "2026-10-11",
  publicProfile: "2026-10-11"
});

const CONSENT_TYPES = Object.freeze({
  terms: "terms",
  personalData: "personal_data",
  communityRules: "community_rules",
  publicProfile: "public_profile"
});

export async function ensureLegalSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS user_consents (
      user_id TEXT NOT NULL,
      consent_type TEXT NOT NULL,
      document_version TEXT NOT NULL,
      granted_at INTEGER NOT NULL,
      revoked_at INTEGER,
      PRIMARY KEY (user_id, consent_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
}

function accepted(value, version) {
  return value === true && version && typeof version === "string";
}

export function validateRequiredLegalAcceptance(legal) {
  const input = legal && typeof legal === "object" ? legal : {};
  const required = [
    ["terms", LEGAL_VERSIONS.terms],
    ["personalData", LEGAL_VERSIONS.personalData],
    ["communityRules", LEGAL_VERSIONS.communityRules]
  ];
  for (const [key, version] of required) {
    if (!accepted(input[key]?.accepted, input[key]?.version) || input[key].version !== version) {
      throw new RequestError("legal_consent_required", 403);
    }
  }
  if (input.publicProfile?.accepted === true && input.publicProfile.version !== LEGAL_VERSIONS.publicProfile) {
    throw new RequestError("legal_consent_version_mismatch", 409);
  }
  return input;
}

async function setConsent(db, userId, type, version, granted) {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO user_consents (user_id, consent_type, document_version, granted_at, revoked_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, consent_type) DO UPDATE SET
      document_version = excluded.document_version,
      granted_at = excluded.granted_at,
      revoked_at = excluded.revoked_at
  `).bind(userId, type, version, now, granted ? null : now).run();
}

export async function recordLegalAcceptance(db, userId, legal) {
  const input = validateRequiredLegalAcceptance(legal);
  await ensureLegalSchema(db);
  await db.batch([
    db.prepare(`INSERT INTO user_consents (user_id, consent_type, document_version, granted_at, revoked_at)
      VALUES (?, ?, ?, ?, NULL)
      ON CONFLICT(user_id, consent_type) DO UPDATE SET document_version = excluded.document_version,
      granted_at = excluded.granted_at, revoked_at = NULL`)
      .bind(userId, CONSENT_TYPES.terms, LEGAL_VERSIONS.terms, Date.now()),
    db.prepare(`INSERT INTO user_consents (user_id, consent_type, document_version, granted_at, revoked_at)
      VALUES (?, ?, ?, ?, NULL)
      ON CONFLICT(user_id, consent_type) DO UPDATE SET document_version = excluded.document_version,
      granted_at = excluded.granted_at, revoked_at = NULL`)
      .bind(userId, CONSENT_TYPES.personalData, LEGAL_VERSIONS.personalData, Date.now()),
    db.prepare(`INSERT INTO user_consents (user_id, consent_type, document_version, granted_at, revoked_at)
      VALUES (?, ?, ?, ?, NULL)
      ON CONFLICT(user_id, consent_type) DO UPDATE SET document_version = excluded.document_version,
      granted_at = excluded.granted_at, revoked_at = NULL`)
      .bind(userId, CONSENT_TYPES.communityRules, LEGAL_VERSIONS.communityRules, Date.now())
  ]);
  await setConsent(
    db,
    userId,
    CONSENT_TYPES.publicProfile,
    LEGAL_VERSIONS.publicProfile,
    input.publicProfile?.accepted === true
  );
}

export async function legalStatus(db, userId) {
  await ensureLegalSchema(db);
  const rows = await db.prepare(`
    SELECT consent_type AS type, document_version AS version, granted_at AS grantedAt, revoked_at AS revokedAt
    FROM user_consents WHERE user_id = ?
  `).bind(userId).all();
  const active = new Map((rows.results || []).filter((row) => row.revokedAt == null).map((row) => [row.type, row.version]));
  const requiredAccepted = active.get(CONSENT_TYPES.terms) === LEGAL_VERSIONS.terms
    && active.get(CONSENT_TYPES.personalData) === LEGAL_VERSIONS.personalData
    && active.get(CONSENT_TYPES.communityRules) === LEGAL_VERSIONS.communityRules;
  return {
    requiredAccepted,
    publicProfile: active.get(CONSENT_TYPES.publicProfile) === LEGAL_VERSIONS.publicProfile,
    versions: LEGAL_VERSIONS
  };
}

export async function publicProfileAllowed(db, userId) {
  return (await legalStatus(db, userId)).publicProfile;
}

export function publicRegistrationEnabled(env) {
  return String(env.PUBLIC_REGISTRATION_ENABLED || "").toLowerCase() === "true";
}

export function betaTesterAllowed(env, vkUserId) {
  const allowed = String(env.BETA_TESTER_VK_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(String(vkUserId));
}
