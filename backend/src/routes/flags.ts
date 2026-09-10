import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'

import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

export const flagsRouter = Router()

const MAX_REASON_LENGTH = 1000

flagsRouter.post('/', asyncHandler(async (req, res) => {
  const { questionId, reason } = req.body ?? {}

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

  const [questionRows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM bank_questions WHERE id = ?',
    [questionId],
  )
  if (questionRows.length === 0) {
    res.status(404).json({ error: 'Question not found' })
    return
  }

  const id = randomUUID()
  await pool.query(
    'INSERT INTO question_flags (id, question_id, user_id, reason) VALUES (?, ?, ?, ?)',
    [id, questionId, req.user!.id, reason.trim()],
  )

  res.status(201).json({ id })
}))
