import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { pool } from '../db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@cpareviewer.test',
  password: 'password123',
}

const ADMIN_USER = {
  name: 'Admin User',
  email: 'admin@cpareviewer.test',
  password: 'admin12345',
}

interface RawQuestion {
  id: string
  prompt: string
  choices: { id: string; text: string }[]
  correctChoiceId: string | null
  rationale: string
}

const QUIZ_SET = {
  id: 'at-preweek-b51',
  title: 'AT Preweek B51',
  description: 'Auditing Theory — preweek review, batch 51',
}

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10)
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [randomUUID(), DEMO_USER.name, DEMO_USER.email, passwordHash],
  )
  console.log(`Seeded demo user "${DEMO_USER.email}" (password: ${DEMO_USER.password}).`)

  const adminPasswordHash = await bcrypt.hash(ADMIN_USER.password, 10)
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role)
     VALUES (?, ?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name), role = 'admin'`,
    [randomUUID(), ADMIN_USER.name, ADMIN_USER.email, adminPasswordHash],
  )
  console.log(`Seeded admin user "${ADMIN_USER.email}" (password: ${ADMIN_USER.password}).`)

  const seedPath = path.resolve(
    __dirname,
    '../../../frontend/src/data/seeds/at-b51-raw.json',
  )
  const raw = await readFile(seedPath, 'utf-8')
  const questions: RawQuestion[] = JSON.parse(raw)

  await pool.query(
    `INSERT INTO quiz_sets (id, title, description)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`,
    [QUIZ_SET.id, QUIZ_SET.title, QUIZ_SET.description],
  )

  for (const [index, question] of questions.entries()) {
    await pool.query(
      `INSERT INTO questions (id, quiz_set_id, prompt, correct_choice_id, rationale, position)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         prompt = VALUES(prompt),
         correct_choice_id = VALUES(correct_choice_id),
         rationale = VALUES(rationale),
         position = VALUES(position)`,
      [
        question.id,
        QUIZ_SET.id,
        question.prompt,
        question.correctChoiceId,
        question.rationale,
        index,
      ],
    )

    for (const [choiceIndex, choice] of question.choices.entries()) {
      await pool.query(
        `INSERT INTO choices (question_id, choice_id, text, position)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE text = VALUES(text), position = VALUES(position)`,
        [question.id, choice.id, choice.text, choiceIndex],
      )
    }
  }

  console.log(`Seeded ${questions.length} questions into quiz set "${QUIZ_SET.title}".`)
  await pool.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
