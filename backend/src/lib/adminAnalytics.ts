import type { RowDataPacket } from 'mysql2'

import { pool } from '../db/pool.js'

// A session with no activity in this window still counts as signed in
// (ended_at IS NULL — nothing has logged it out) but shows as "Inactive"
// rather than "Active" in the admin view. Shared with routes/admin.ts's
// /sessions handler so both use one definition.
export const ACTIVE_SESSION_WINDOW_MS = 5 * 60 * 1000

const MODE_LABELS: Record<string, string> = {
  tos_simulator: 'TOS Simulator Mode',
  subject_drill: 'Subject Drill',
}

interface CountRow extends RowDataPacket {
  c: number
}

async function scalarCount(sql: string, params: unknown[] = []): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(sql, params)
  return Number(rows[0]?.c ?? 0)
}

/** Percent change from `previous` to `current`. Null (rather than a
 * fabricated/huge percentage) when there's no real baseline to compare
 * against — the frontend omits the delta line entirely in that case. */
function computeDeltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export interface StatWithDelta {
  value: number
  deltaPercent: number | null
}

async function weeklyDeltaStat(currentSql: string, previousSql: string): Promise<StatWithDelta> {
  const [current, previous] = await Promise.all([
    scalarCount(currentSql),
    scalarCount(previousSql),
  ])
  return { value: current, deltaPercent: computeDeltaPercent(current, previous) }
}

export function getTotalUsersStat(): Promise<StatWithDelta> {
  return weeklyDeltaStat(
    'SELECT COUNT(*) AS c FROM users',
    'SELECT COUNT(*) AS c FROM users WHERE created_at <= (NOW() - INTERVAL 7 DAY)',
  )
}

export function getActiveUsersStat(): Promise<StatWithDelta> {
  return weeklyDeltaStat(
    `SELECT COUNT(DISTINCT user_id) AS c FROM user_sessions
     WHERE created_at >= (NOW() - INTERVAL 7 DAY)`,
    `SELECT COUNT(DISTINCT user_id) AS c FROM user_sessions
     WHERE created_at >= (NOW() - INTERVAL 14 DAY) AND created_at < (NOW() - INTERVAL 7 DAY)`,
  )
}

export function getExamsGeneratedStat(): Promise<StatWithDelta> {
  return weeklyDeltaStat(
    'SELECT COUNT(*) AS c FROM exam_sessions',
    'SELECT COUNT(*) AS c FROM exam_sessions WHERE started_at <= (NOW() - INTERVAL 7 DAY)',
  )
}

export function countActiveSessions(): Promise<number> {
  return scalarCount(
    `SELECT COUNT(*) AS c FROM user_sessions
     WHERE ended_at IS NULL AND last_seen_at >= (NOW() - INTERVAL 5 MINUTE)`,
  )
}

export async function getDatabaseSizeBytes(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT SUM(data_length + index_length) AS bytes
     FROM information_schema.tables
     WHERE table_schema = DATABASE()`,
  )
  return Number(rows[0]?.bytes ?? 0)
}

interface DayRow extends RowDataPacket {
  day: Date
  c: number
}

/** Daily distinct-logins count for each of the last 7 calendar days
 * (UTC), oldest first — zero-filled for days with no logins at all. */
export async function getDailyActiveUsersSeries(): Promise<{ date: string; activeUsers: number }[]> {
  const [rows] = await pool.query<DayRow[]>(
    `SELECT DATE(created_at) AS day, COUNT(DISTINCT user_id) AS c
     FROM user_sessions
     WHERE created_at >= (CURDATE() - INTERVAL 6 DAY)
     GROUP BY DATE(created_at)`,
  )
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.c)]))

  const series: { date: string; activeUsers: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    series.push({ date: key, activeUsers: byDay.get(key) ?? 0 })
  }
  return series
}

export interface UsageStats {
  activeUsers: StatWithDelta
  examsTaken: StatWithDelta
  questionsAnswered: StatWithDelta
  /** Null when no exam has ever been submitted — too small a sample (or no
   * sample at all) to average, rather than showing a misleading 0. */
  avgExamDurationSeconds: number | null
}

interface AvgSecondsRow extends RowDataPacket {
  avg_seconds: number | string | null
}

/** All scoped to "trailing 7 days" (matching the card's "Last 7 days" label),
 * each paired with the preceding 7-day window for a real week-over-week delta. */
export async function getUsageStats(): Promise<UsageStats> {
  const [activeUsers, examsTaken, questionsAnswered, durationRows] = await Promise.all([
    weeklyDeltaStat(
      `SELECT COUNT(DISTINCT user_id) AS c FROM user_sessions
       WHERE created_at >= (NOW() - INTERVAL 7 DAY)`,
      `SELECT COUNT(DISTINCT user_id) AS c FROM user_sessions
       WHERE created_at >= (NOW() - INTERVAL 14 DAY) AND created_at < (NOW() - INTERVAL 7 DAY)`,
    ),
    weeklyDeltaStat(
      'SELECT COUNT(*) AS c FROM exam_sessions WHERE submitted_at >= (NOW() - INTERVAL 7 DAY)',
      `SELECT COUNT(*) AS c FROM exam_sessions
       WHERE submitted_at >= (NOW() - INTERVAL 14 DAY) AND submitted_at < (NOW() - INTERVAL 7 DAY)`,
    ),
    weeklyDeltaStat(
      `SELECT COUNT(*) AS c FROM exam_answers ea JOIN exam_sessions es ON es.id = ea.session_id
       WHERE es.submitted_at >= (NOW() - INTERVAL 7 DAY)`,
      `SELECT COUNT(*) AS c FROM exam_answers ea JOIN exam_sessions es ON es.id = ea.session_id
       WHERE es.submitted_at >= (NOW() - INTERVAL 14 DAY) AND es.submitted_at < (NOW() - INTERVAL 7 DAY)`,
    ),
    pool.query<AvgSecondsRow[]>(
      `SELECT AVG(TIMESTAMPDIFF(SECOND, started_at, submitted_at)) AS avg_seconds
       FROM exam_sessions
       WHERE submitted_at IS NOT NULL AND submitted_at >= (NOW() - INTERVAL 7 DAY)`,
    ),
  ])

  const avgSeconds = durationRows[0][0]?.avg_seconds
  return {
    activeUsers,
    examsTaken,
    questionsAnswered,
    avgExamDurationSeconds: avgSeconds == null ? null : Number(avgSeconds),
  }
}

export interface FeatureUsageItem {
  mode: string
  label: string
  count: number
  percent: number
}

interface ModeCountRow extends RowDataPacket {
  mode: string
  c: number
}

/** All-time exam-mode split — the only "feature usage" this app actually
 * tracks server-side (classic practice quizzes only ever live in browser
 * localStorage, and there's no telemetry for flashcards/AI variation mode). */
export async function getFeatureUsage(): Promise<FeatureUsageItem[]> {
  const [rows] = await pool.query<ModeCountRow[]>(
    'SELECT mode, COUNT(*) AS c FROM exam_sessions GROUP BY mode',
  )
  const total = rows.reduce((sum, r) => sum + Number(r.c), 0)
  if (total === 0) return []

  return rows
    .map((r) => ({
      mode: r.mode,
      label: MODE_LABELS[r.mode] ?? r.mode,
      count: Number(r.c),
      percent: Math.round((Number(r.c) / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

export interface TopLocationItem {
  /** Raw resolved label, e.g. "Manila, Philippines" or "Local network" — the
   * frontend decides how (or whether) to plot it on the map illustration. */
  location: string
  count: number
}

interface LocationCountRow extends RowDataPacket {
  location_label: string
  c: number
}

/** Where currently-online sessions are connecting from, most first. Scoped
 * to the same "active" definition as the Active Sessions badge (open and
 * seen in the last 5 minutes) so the two numbers agree with each other. */
export async function getTopLocations(limit = 5): Promise<TopLocationItem[]> {
  const [rows] = await pool.query<LocationCountRow[]>(
    `SELECT location_label, COUNT(*) AS c
     FROM user_sessions
     WHERE ended_at IS NULL
       AND last_seen_at >= (NOW() - INTERVAL 5 MINUTE)
       AND location_label IS NOT NULL
     GROUP BY location_label
     ORDER BY c DESC
     LIMIT ?`,
    [limit],
  )
  return rows.map((r) => ({ location: r.location_label, count: Number(r.c) }))
}

export interface RecentActivityItem {
  id: string
  type: 'registration' | 'login' | 'exam_generated' | 'exam_submitted'
  title: string
  subtitle: string
  timestamp: string
}

interface RegistrationRow extends RowDataPacket {
  id: string
  email: string
  created_at: Date
}
interface LoginRow extends RowDataPacket {
  id: string
  email: string
  created_at: Date
}
interface ExamGeneratedRow extends RowDataPacket {
  id: string
  email: string
  subject: string
  mode: string
  started_at: Date
}
interface ExamSubmittedRow extends RowDataPacket {
  id: string
  email: string
  subject: string
  score: number
  item_count: number
  submitted_at: Date
}

/** Merges registrations, logins, exam generations, and exam submissions into
 * one real activity feed, newest first. There's no admin-action audit log,
 * so "admin updated settings"-style events (present in the old mock data)
 * simply can't appear here — nothing tracks those today. */
export async function getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
  const [[registrations], [logins], [examsGenerated], [examsSubmitted]] = await Promise.all([
    pool.query<RegistrationRow[]>(
      'SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT ?',
      [limit],
    ),
    pool.query<LoginRow[]>(
      `SELECT s.id AS id, u.email AS email, s.created_at AS created_at
       FROM user_sessions s JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC LIMIT ?`,
      [limit],
    ),
    pool.query<ExamGeneratedRow[]>(
      `SELECT es.id AS id, u.email AS email, es.subject AS subject, es.mode AS mode, es.started_at AS started_at
       FROM exam_sessions es JOIN users u ON u.id = es.user_id
       ORDER BY es.started_at DESC LIMIT ?`,
      [limit],
    ),
    pool.query<ExamSubmittedRow[]>(
      `SELECT es.id AS id, u.email AS email, es.subject AS subject, es.score AS score,
              es.item_count AS item_count, es.submitted_at AS submitted_at
       FROM exam_sessions es JOIN users u ON u.id = es.user_id
       WHERE es.submitted_at IS NOT NULL
       ORDER BY es.submitted_at DESC LIMIT ?`,
      [limit],
    ),
  ])

  const items: RecentActivityItem[] = [
    ...registrations.map((r) => ({
      id: `registration-${r.id}`,
      type: 'registration' as const,
      title: 'New user registered',
      subtitle: r.email,
      timestamp: r.created_at.toISOString(),
    })),
    ...logins.map((r) => ({
      id: `login-${r.id}`,
      type: 'login' as const,
      title: 'User logged in',
      subtitle: r.email,
      timestamp: r.created_at.toISOString(),
    })),
    ...examsGenerated.map((r) => ({
      id: `exam-generated-${r.id}`,
      type: 'exam_generated' as const,
      title: 'New exam generated',
      subtitle: `${r.subject} — ${MODE_LABELS[r.mode] ?? r.mode}`,
      timestamp: r.started_at.toISOString(),
    })),
    ...examsSubmitted.map((r) => ({
      id: `exam-submitted-${r.id}`,
      type: 'exam_submitted' as const,
      title: 'Exam completed',
      subtitle: `${r.subject} — ${r.score}/${r.item_count} (${Math.round((r.score / r.item_count) * 100)}%)`,
      timestamp: r.submitted_at.toISOString(),
    })),
  ]

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return items.slice(0, limit)
}
