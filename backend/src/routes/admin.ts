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
