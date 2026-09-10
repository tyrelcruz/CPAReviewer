import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'

import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

export const flagsRouter = Router()

const MAX_REASON_LENGTH = 1000
const MAX_SUGGESTED_ANSWER_LENGTH = 500

flagsRouter.post('/', asyncHandler(async (req, res) => {
  const { questionId, reason, suggestedChoiceId, suggestedAnswerText } = req.body ?? {}

  if (typeof questionId !== 'string' || !questionId) {
    res.status(400).json({ error: 'questionId is required' })
    return
  }
  if (typeof reason !== 'string' || !reason.trim()) {
    res.status(400).json({ error: 'reason is required' })
    return
  }
  if (reason.length > MAX_REASON_LENGTH) {
    res.status(400).json({ error: `reason must be at most ${MAX_REASON_LENGTH} characters` })
    return
  }
  if (suggestedChoiceId !== undefined && typeof suggestedChoiceId !== 'string') {
    res.status(400).json({ error: 'suggestedChoiceId must be a string' })
    return
  }
  if (suggestedAnswerText !== undefined && typeof suggestedAnswerText !== 'string') {
    res.status(400).json({ error: 'suggestedAnswerText must be a string' })
    return
  }
  if (suggestedChoiceId && suggestedAnswerText?.trim()) {
    res.status(400).json({
      error: 'Provide either suggestedChoiceId or suggestedAnswerText, not both',
    })
    return
  }
  if (suggestedAnswerText && suggestedAnswerText.length > MAX_SUGGESTED_ANSWER_LENGTH) {
    res
      .status(400)
      .json({ error: `suggestedAnswerText must be at most ${MAX_SUGGESTED_ANSWER_LENGTH} characters` })
    return
  }

  const [questionRows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM bank_questions WHERE id = ?',
    [questionId],
  )
  if (questionRows.length === 0) {
    res.status(404).json({ error: 'Question not found' })
    return
  }

  if (suggestedChoiceId) {
    const [choiceRows] = await pool.query<RowDataPacket[]>(
      'SELECT choice_id FROM bank_choices WHERE question_id = ? AND choice_id = ?',
      [questionId, suggestedChoiceId],
    )
    if (choiceRows.length === 0) {
      res.status(400).json({ error: 'suggestedChoiceId is not one of this question\'s choices' })
      return
    }
  }

  const id = randomUUID()
  await pool.query(
    `INSERT INTO question_flags (id, question_id, user_id, reason, suggested_choice_id, suggested_answer_text)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      questionId,
      req.user!.id,
      reason.trim(),
      suggestedChoiceId || null,
      suggestedAnswerText?.trim() || null,
    ],
  )

  res.status(201).json({ id })
}))
