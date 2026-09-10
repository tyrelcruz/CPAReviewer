import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'

import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  ACTIVE_SESSION_WINDOW_MS,
  countActiveSessions,
  getActiveUsersStat,
  getDailyActiveUsersSeries,
  getDatabaseSizeBytes,
  getExamsGeneratedStat,
  getFeatureUsage,
  getRecentActivity,
  getTopLocations,
  getTotalUsersStat,
  getUsageStats,
} from '../lib/adminAnalytics.js'

export const adminRouter = Router()

interface SessionRow extends RowDataPacket {
  session_id: string
  user_id: string
  name: string
  email: string
  role: 'user' | 'admin'
  device_label: string
  location_label: string | null
  created_at: Date
  last_seen_at: Date
}

adminRouter.get('/sessions', asyncHandler(async (_req, res) => {
  // ended_at alone isn't enough to mean "still current": a superseded
  // session's grace period (pending_logout_at) is only turned into a real
  // ended_at lazily, the next time *that* device happens to make an
  // authenticated request (see requireAuth) — a device that never does
  // (closed tab, sleeping laptop) leaves ended_at NULL forever. Without this
  // second check, that dead session keeps counting as a live concurrent
  // device (the "×N devices" badge) indefinitely, even though the app only
  // ever allows one truly-active device per account past the grace window.
  const [rows] = await pool.query<SessionRow[]>(
    `SELECT s.id AS session_id, u.id AS user_id, u.name, u.email, u.role,
            s.device_label, s.location_label, s.created_at, s.last_seen_at
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.ended_at IS NULL
       AND (s.pending_logout_at IS NULL OR s.pending_logout_at > CURRENT_TIMESTAMP)
     ORDER BY s.last_seen_at DESC`,
  )

  const now = Date.now()
  const sessions = rows.map((row) => ({
    sessionId: row.session_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    device: row.device_label,
    location: row.location_label,
    loginAt: row.created_at.toISOString(),
    lastActiveAt: row.last_seen_at.toISOString(),
    status: (now - row.last_seen_at.getTime() <= ACTIVE_SESSION_WINDOW_MS ? 'active' : 'inactive') as
      | 'active'
      | 'inactive',
  }))

  res.json({
    sessions,
    activeCount: sessions.filter((s) => s.status === 'active').length,
    totalCount: sessions.length,
  })
}))

adminRouter.get('/analytics', asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    activeUsers,
    examsGenerated,
    activeSessions,
    databaseSizeBytes,
    usageSeries,
    usageStats,
    featureUsage,
    recentActivity,
    topLocations,
  ] = await Promise.all([
    getTotalUsersStat(),
    getActiveUsersStat(),
    getExamsGeneratedStat(),
    countActiveSessions(),
    getDatabaseSizeBytes(),
    getDailyActiveUsersSeries(),
    getUsageStats(),
    getFeatureUsage(),
    getRecentActivity(10),
    getTopLocations(5),
  ])

  res.json({
    stats: {
      totalUsers,
      activeUsers,
      examsGenerated,
      activeSessions: { value: activeSessions },
      databaseSizeBytes,
    },
    usageSeries,
    usageStats,
    featureUsage,
    recentActivity,
    topLocations,
  })
}))

interface FlagRow extends RowDataPacket {
  id: string
  question_id: string
  reason: string
  suggested_choice_text: string | null
  suggested_answer_text: string | null
  created_at: Date
  flagged_by_name: string
  flagged_by_email: string
  subject: string | null
  prompt: string | null
  correct_answer: string | null
}

adminRouter.get('/flags', asyncHandler(async (_req, res) => {
  // LEFT JOINs throughout — a flagged question (or its correct/suggested
  // choice) can be deleted/re-ingested out from under its flag; the report
  // should still show (with those fields null) rather than silently disappear.
  const [rows] = await pool.query<FlagRow[]>(
    `SELECT qf.id, qf.question_id, qf.reason, qf.suggested_answer_text, qf.created_at,
            u.name AS flagged_by_name, u.email AS flagged_by_email,
            bq.subject, bq.prompt, bc.text AS correct_answer, sc.text AS suggested_choice_text
     FROM question_flags qf
     JOIN users u ON u.id = qf.user_id
     LEFT JOIN bank_questions bq ON bq.id = qf.question_id
     LEFT JOIN bank_choices bc ON bc.question_id = bq.id AND bc.choice_id = bq.correct_choice_id
     LEFT JOIN bank_choices sc ON sc.question_id = qf.question_id AND sc.choice_id = qf.suggested_choice_id
     ORDER BY qf.created_at DESC`,
  )

  res.json({
    flags: rows.map((row) => ({
      id: row.id,
      questionId: row.question_id,
      subject: row.subject,
      prompt: row.prompt,
      correctAnswer: row.correct_answer,
      // A learner's suggested-choice pick resolves to that choice's own
      // text; a free-typed suggestion (believed not among the choices) is
      // used as-is. `suggestedAnswerIsCustom` lets the admin UI badge the
      // latter distinctly from a plain lettered pick.
      suggestedAnswer: row.suggested_choice_text ?? row.suggested_answer_text,
      suggestedAnswerIsCustom: row.suggested_choice_text === null && row.suggested_answer_text !== null,
      reason: row.reason,
      flaggedByName: row.flagged_by_name,
      flaggedByEmail: row.flagged_by_email,
      createdAt: row.created_at.toISOString(),
    })),
  })
}))
