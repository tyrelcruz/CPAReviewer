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

interface SourceRow extends RowDataPacket {
  question_id: string
  center: string
  batch: string
  exam_type: string
}

const PAGE_SIZE = 50

bankQuestionsRouter.get('/', asyncHandler(async (req, res) => {
  const { subject, tosCode, difficulty, cognitiveLevel, center, page } = req.query

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
  if (typeof center === 'string') {
    conditions.push('EXISTS (SELECT 1 FROM bank_sources bs WHERE bs.question_id = bq.id AND bs.center = ?)')
    params.push(center)
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

  const ids = rows.map((r) => r.id)
  const sourcesByQuestion = new Map<string, { center: string; batch: string; examType: string }[]>()
  if (ids.length > 0) {
    const [sourceRows] = await pool.query<SourceRow[]>(
      `SELECT question_id, center, batch, exam_type FROM bank_sources WHERE question_id IN (?)`,
      [ids],
    )
    for (const s of sourceRows) {
      const list = sourcesByQuestion.get(s.question_id) ?? []
      list.push({ center: s.center, batch: s.batch, examType: s.exam_type })
      sourcesByQuestion.set(s.question_id, list)
    }
  }

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
      sources: sourcesByQuestion.get(r.id) ?? [],
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
