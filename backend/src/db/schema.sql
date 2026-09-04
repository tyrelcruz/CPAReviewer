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
