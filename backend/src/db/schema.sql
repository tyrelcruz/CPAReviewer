CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS tos_categories (
  tos_code VARCHAR(16) PRIMARY KEY,
  subject VARCHAR(16) NOT NULL,
  topic_category VARCHAR(255) NOT NULL,
  sub_topic VARCHAR(255) NOT NULL,
  weight_pct DECIMAL(5,2) NULL
);

CREATE INDEX idx_tos_categories_subject ON tos_categories(subject);

CREATE TABLE IF NOT EXISTS bank_questions (
  id VARCHAR(64) PRIMARY KEY,
  tos_code VARCHAR(16) NOT NULL,
  cognitive_level VARCHAR(32) NOT NULL,
  difficulty ENUM('Easy', 'Moderate', 'Difficult') NOT NULL,
  prompt TEXT NOT NULL,
  correct_choice_id VARCHAR(16) NOT NULL,
  rationale TEXT NOT NULL,
  canonical_concept TEXT NOT NULL,
  canonical_concept_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tos_code) REFERENCES tos_categories(tos_code)
);

CREATE INDEX idx_bank_questions_tos_code ON bank_questions(tos_code);
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
  mode ENUM('tos_simulator', 'review_center_drill') NOT NULL,
  item_count INT NOT NULL,
  difficulty_weights JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id VARCHAR(64) PRIMARY KEY,
  exam_id VARCHAR(64) NULL,
  user_id VARCHAR(64) NOT NULL,
  subject VARCHAR(16) NOT NULL,
  mode ENUM('tos_simulator', 'review_center_drill') NOT NULL,
  center_filter VARCHAR(255) NULL,
  item_count INT NOT NULL,
  score INT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_exam_sessions_user ON exam_sessions(user_id);

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
