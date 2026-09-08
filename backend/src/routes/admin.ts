import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'

import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

export const adminRouter = Router()

// A session with no activity in this window still counts as signed in
// (ended_at IS NULL — nothing has superseded or logged it out) but shows as
// "Inactive" rather than "Active" in the admin view.
const ACTIVE_WINDOW_MS = 5 * 60 * 1000

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
  const [rows] = await pool.query<SessionRow[]>(
    `SELECT s.id AS session_id, u.id AS user_id, u.name, u.email, u.role,
            s.device_label, s.location_label, s.created_at, s.last_seen_at
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.ended_at IS NULL
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
    status: (now - row.last_seen_at.getTime() <= ACTIVE_WINDOW_MS ? 'active' : 'inactive') as
      | 'active'
      | 'inactive',
  }))

  res.json({
    sessions,
    activeCount: sessions.filter((s) => s.status === 'active').length,
    totalCount: sessions.length,
  })
}))
