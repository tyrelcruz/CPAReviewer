import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'

import { pool } from '../db/pool.js'

export const quizSetsRouter = Router()

interface QuizSetRow extends RowDataPacket {
  id: string
  title: string
  description: string
}

interface QuestionRow extends RowDataPacket {
  id: string
  prompt: string
  correct_choice_id: string | null
  rationale: string
  position: number
}

interface ChoiceRow extends RowDataPacket {
  question_id: string
  choice_id: string
  text: string
  position: number
}

quizSetsRouter.get('/', async (_req, res) => {
  const [rows] = await pool.query<QuizSetRow[]>(
    `SELECT qs.id, qs.title, qs.description, COUNT(q.id) AS questionCount
     FROM quiz_sets qs
     LEFT JOIN questions q ON q.quiz_set_id = qs.id
     GROUP BY qs.id, qs.title, qs.description
     ORDER BY qs.created_at ASC`,
  )
  res.json(rows)
})

quizSetsRouter.get('/:id', async (req, res) => {
  const { id } = req.params

  const [setRows] = await pool.query<QuizSetRow[]>(
    'SELECT id, title, description FROM quiz_sets WHERE id = ?',
    [id],
  )
  const quizSet = setRows[0]
  if (!quizSet) {
    res.status(404).json({ error: 'Quiz set not found' })
    return
  }

  const [questionRows] = await pool.query<QuestionRow[]>(
    `SELECT id, prompt, correct_choice_id, rationale, position
     FROM questions
     WHERE quiz_set_id = ? AND correct_choice_id IS NOT NULL
     ORDER BY position ASC`,
    [id],
  )

  const [choiceRows] = await pool.query<ChoiceRow[]>(
    `SELECT c.question_id, c.choice_id, c.text, c.position
     FROM choices c
     JOIN questions q ON q.id = c.question_id
     WHERE q.quiz_set_id = ?
     ORDER BY c.position ASC`,
    [id],
  )

  const choicesByQuestion = new Map<string, ChoiceRow[]>()
  for (const choice of choiceRows) {
    const list = choicesByQuestion.get(choice.question_id) ?? []
    list.push(choice)
    choicesByQuestion.set(choice.question_id, list)
  }

  const questions = questionRows.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    correctChoiceId: q.correct_choice_id,
    rationale: q.rationale,
    choices: (choicesByQuestion.get(q.id) ?? []).map((c) => ({
      id: c.choice_id,
      text: c.text,
    })),
  }))

  res.json({
    id: quizSet.id,
    title: quizSet.title,
    description: quizSet.description,
    questions,
  })
})
