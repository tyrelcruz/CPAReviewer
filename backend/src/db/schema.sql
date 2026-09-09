CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  course ENUM('cpa', 'rmt') NOT NULL DEFAULT 'cpa',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- schema.sql only auto-applies to a fresh docker volume, so `npm run
-- db:migrate` re-runs this file against a running container to pick up new
-- columns. migrate.ts tolerates the "column already exists" / "already
-- dropped" errors below, so this stays safe to run repeatedly.
ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';
-- Which board exam this account is reviewing for — drives which mock exams/
-- subjects are shown (see api/exams.ts's subject-agnostic pipeline and
-- ExamSetupPage/MockExamsPage on the frontend). DEFAULT 'cpa' backfills
-- every pre-existing row in one statement; seed.ts overrides the demo
-- account to 'rmt' explicitly.
ALTER TABLE users ADD COLUMN course ENUM('cpa', 'rmt') NOT NULL DEFAULT 'cpa';
-- Superseded by user_sessions below, which is now the single source of truth
-- for "is this token's session still valid" (see requireAuth) instead of a
-- column on users that duplicated the same state.
ALTER TABLE users DROP COLUMN active_session_id;
-- Auth is now fully OTP-based (see otp_codes below) — no password is ever
-- set, so this column has nothing left to store.
ALTER TABLE users DROP COLUMN password_hash;

-- One pending code per email (new request overwrites any unexpired one).
-- `purpose` distinguishes a signup (no account yet — `pending_name` holds
-- the name to create the account with once verified) from a login (account
-- already exists). code_hash is a fast SHA-256, not bcrypt — see lib/otp.ts
-- for why that's fine here.
CREATE TABLE IF NOT EXISTS otp_codes (
  email VARCHAR(255) PRIMARY KEY,
  code_hash VARCHAR(64) NOT NULL,
  purpose ENUM('signup', 'login') NOT NULL,
  pending_name VARCHAR(255) NULL,
  pending_course ENUM('cpa', 'rmt') NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE otp_codes ADD COLUMN pending_course ENUM('cpa', 'rmt') NULL;

-- One row per login. `id` is the session id ("sid") embedded in that login's
-- JWT — requireAuth looks a request's sid up here on every call: a row with
-- ended_at IS NULL is a live session; NULL result or a non-null ended_at
-- means the session has been logged out, so the request is rejected. Only one
-- device may be active per account: a new login gives every other open
-- session a grace period (pending_logout_at) instead of an instant silent
-- kick, so its owner sees a countdown warning before requireAuth finalizes
-- it (sets ended_at) and starts rejecting it. Also the source of the admin
-- "Active Sessions" view: device/location are captured once at login,
-- last_seen_at is bumped by requireAuth (throttled) to distinguish "logged
-- in and active right now" from "logged in but idle".
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  ip_address VARCHAR(64) NOT NULL,
  user_agent TEXT NOT NULL,
  device_label VARCHAR(128) NOT NULL,
  location_label VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  -- Set when a newer login on another device starts this session's grace
  -- period countdown; NULL means no logout is pending.
  pending_logout_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_open ON user_sessions(user_id, ended_at);
ALTER TABLE user_sessions ADD COLUMN pending_logout_at TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS quiz_sets (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  quiz_set_id VARCHAR(64) NOT NULL,
  prompt TEXT NOT NULL,
  correct_choice_id VARCHAR(16) NULL,
  rationale TEXT NOT NULL,
  position INT NOT NULL,
  FOREIGN KEY (quiz_set_id) REFERENCES quiz_sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS choices (
  question_id VARCHAR(64) NOT NULL,
  choice_id VARCHAR(16) NOT NULL,
  text TEXT NOT NULL,
  position INT NOT NULL,
  PRIMARY KEY (question_id, choice_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX idx_questions_quiz_set ON questions(quiz_set_id);

-- Question bank: TOS/source-tagged, cross-center-deduped questions (separate
-- from the quiz_sets/questions/choices tables above, which back the static
-- practice sets and are untouched by this system).

-- tos_code (e.g. "A.1") is only unique within a subject — different subjects'
-- kb files independently number their own TOS codes, so the key must be
-- (subject, tos_code), not tos_code alone.
CREATE TABLE IF NOT EXISTS tos_categories (
  subject VARCHAR(16) NOT NULL,
  tos_code VARCHAR(16) NOT NULL,
  topic_category VARCHAR(255) NOT NULL,
  sub_topic VARCHAR(255) NOT NULL,
  weight_pct DECIMAL(5,2) NULL,
  PRIMARY KEY (subject, tos_code)
);

CREATE TABLE IF NOT EXISTS bank_questions (
  id VARCHAR(64) PRIMARY KEY,
  subject VARCHAR(16) NOT NULL,
  tos_code VARCHAR(16) NOT NULL,
  cognitive_level VARCHAR(32) NOT NULL,
  difficulty ENUM('Easy', 'Moderate', 'Difficult') NOT NULL,
  prompt TEXT NOT NULL,
  correct_choice_id VARCHAR(16) NOT NULL,
  rationale TEXT NOT NULL,
  canonical_concept TEXT NOT NULL,
  canonical_concept_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject, tos_code) REFERENCES tos_categories(subject, tos_code)
);

CREATE INDEX idx_bank_questions_subject_tos_code ON bank_questions(subject, tos_code);
CREATE INDEX idx_bank_questions_difficulty ON bank_questions(difficulty);
CREATE INDEX idx_bank_questions_cognitive_level ON bank_questions(cognitive_level);
CREATE INDEX idx_bank_questions_concept_hash ON bank_questions(canonical_concept_hash);

CREATE TABLE IF NOT EXISTS bank_choices (
  question_id VARCHAR(64) NOT NULL,
  choice_id VARCHAR(16) NOT NULL,
  text TEXT NOT NULL,
  position INT NOT NULL,
  PRIMARY KEY (question_id, choice_id),
  FOREIGN KEY (question_id) REFERENCES bank_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bank_sources (
  id VARCHAR(64) PRIMARY KEY,
  question_id VARCHAR(64) NOT NULL,
  center VARCHAR(255) NOT NULL,
  batch VARCHAR(255) NOT NULL,
  exam_type VARCHAR(255) NOT NULL,
  original_question_id VARCHAR(64) NOT NULL,
  FOREIGN KEY (question_id) REFERENCES bank_questions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_bank_sources_origin (center, original_question_id)
);

CREATE INDEX idx_bank_sources_question ON bank_sources(question_id);
CREATE INDEX idx_bank_sources_center ON bank_sources(center);

CREATE TABLE IF NOT EXISTS exams (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(16) NOT NULL,
  mode ENUM('tos_simulator', 'subject_drill') NOT NULL,
  item_count INT NOT NULL,
  difficulty_weights JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id VARCHAR(64) PRIMARY KEY,
  exam_id VARCHAR(64) NULL,
  user_id VARCHAR(64) NOT NULL,
  subject VARCHAR(16) NOT NULL,
  mode ENUM('tos_simulator', 'subject_drill') NOT NULL,
  -- Vestigial: only ever populated for the retired center-based drill mode.
  -- Left in place (always NULL going forward) rather than dropped, since
  -- dropping a column is a destructive migration not worth doing just for
  -- an unused field.
  center_filter VARCHAR(255) NULL,
  item_count INT NOT NULL,
  score INT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_exam_sessions_user ON exam_sessions(user_id);

-- review_center_drill -> subject_drill rename: widen the enum first so
-- existing 'review_center_drill' rows stay valid while they're updated,
-- then narrow it back down. Safe to rerun via db:migrate.
ALTER TABLE exams MODIFY COLUMN mode ENUM('tos_simulator', 'review_center_drill', 'subject_drill') NOT NULL;
UPDATE exams SET mode = 'subject_drill' WHERE mode = 'review_center_drill';
ALTER TABLE exams MODIFY COLUMN mode ENUM('tos_simulator', 'subject_drill') NOT NULL;
ALTER TABLE exam_sessions MODIFY COLUMN mode ENUM('tos_simulator', 'review_center_drill', 'subject_drill') NOT NULL;
UPDATE exam_sessions SET mode = 'subject_drill' WHERE mode = 'review_center_drill';
ALTER TABLE exam_sessions MODIFY COLUMN mode ENUM('tos_simulator', 'subject_drill') NOT NULL;

CREATE TABLE IF NOT EXISTS exam_session_questions (
  session_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  position INT NOT NULL,
  PRIMARY KEY (session_id, question_id),
  FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES bank_questions(id)
);

CREATE TABLE IF NOT EXISTS exam_answers (
  session_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  choice_id VARCHAR(16) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  PRIMARY KEY (session_id, question_id),
  FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_question_history (
  user_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  last_served_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES bank_questions(id) ON DELETE CASCADE
);
