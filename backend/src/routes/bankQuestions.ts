import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'

import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { ingestBankQuestions } from '../lib/bankIngest.js'

export const bankQuestionsRouter = Router()

interface BankQuestionRow extends RowDataPacket {
  id: string
  prompt: string
  difficulty: string
  cognitive_level: string
  tos_code: string
  topic_category: string
  sub_topic: string
  subject: string
}

const PAGE_SIZE = 50

bankQuestionsRouter.get('/', asyncHandler(async (req, res) => {
  const { subject, tosCode, difficulty, cognitiveLevel, page } = req.query

  const conditions: string[] = []
  const params: unknown[] = []

  if (typeof subject === 'string') {
    conditions.push('tc.subject = ?')
    params.push(subject)
  }
  if (typeof tosCode === 'string') {
    conditions.push('bq.tos_code = ?')
    params.push(tosCode)
  }
  if (typeof difficulty === 'string') {
    conditions.push('bq.difficulty = ?')
    params.push(difficulty)
  }
  if (typeof cognitiveLevel === 'string') {
    conditions.push('bq.cognitive_level = ?')
    params.push(cognitiveLevel)
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const pageNum = Math.max(1, Number(page) || 1)
  const offset = (pageNum - 1) * PAGE_SIZE

  const [rows] = await pool.query<BankQuestionRow[]>(
    `SELECT bq.id, bq.prompt, bq.difficulty, bq.cognitive_level,
            bq.tos_code, tc.topic_category, tc.sub_topic, tc.subject
     FROM bank_questions bq
     JOIN tos_categories tc ON tc.tos_code = bq.tos_code
     ${whereClause}
     ORDER BY bq.id ASC
     LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, offset],
  )

  res.json({
    page: pageNum,
    questions: rows.map((r) => ({
      id: r.id,
      prompt: r.prompt,
      difficulty: r.difficulty,
      cognitiveLevel: r.cognitive_level,
      tosCode: r.tos_code,
      topicCategory: r.topic_category,
      subTopic: r.sub_topic,
      subject: r.subject,
    })),
  })
}))

bankQuestionsRouter.post('/ingest', asyncHandler(async (req, res) => {
  const records = req.body

  if (!Array.isArray(records) || records.length === 0) {
    res.status(400).json({ error: 'Request body must be a non-empty array of question records' })
    return
  }

  const result = await ingestBankQuestions(records)
  res.json(result)
}))
