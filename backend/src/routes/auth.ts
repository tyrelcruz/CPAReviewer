import bcrypt from 'bcryptjs'
import type { Request } from 'express'
import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'

import { describeDevice, getClientIp } from '../lib/deviceInfo.js'
import { resolveLocation } from '../lib/geoLocation.js'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, signToken } from '../middleware/auth.js'

export const authRouter = Router()

// How long another device's session stays valid, showing a countdown
// warning, after this account logs in somewhere new — only one device may
// be active per account, but this gives the previous one a moment to notice
// rather than an instant silent kick.
const GRACE_PERIOD_SECONDS = 30

interface UserRow extends RowDataPacket {
  id: string
  name: string
  email: string
  password_hash: string
  role: 'user' | 'admin'
}

/** Opens a new session for this login/registration, capturing device, IP,
 * and resolved location for the admin "Active Sessions" view — then starts
 * the grace-period countdown on every other still-open session this user
 * has, enforcing one active device per account. The caller's user row must
 * already exist (FK on user_id). */
async function openSession(userId: string, req: Request): Promise<string> {
  const sid = randomUUID()
  const ip = getClientIp(req)
  const userAgent = req.header('user-agent') ?? ''
  const device = describeDevice(userAgent)
  const location = await resolveLocation(ip)

  await pool.query(
    `INSERT INTO user_sessions (id, user_id, ip_address, user_agent, device_label, location_label)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sid, userId, ip, userAgent, device, location],
  )

  // Only the first newer login starts the clock — a second new login
  // shortly after doesn't push the deadline back out, and a session already
  // mid-countdown isn't reset.
  await pool.query(
    `UPDATE user_sessions
     SET pending_logout_at = (CURRENT_TIMESTAMP + INTERVAL ? SECOND)
     WHERE user_id = ? AND id != ? AND ended_at IS NULL AND pending_logout_at IS NULL`,
    [GRACE_PERIOD_SECONDS, userId, sid],
  )

  return sid
}

authRouter.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ?? {}

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !name ||
    !email ||
    password.length < 8
  ) {
    res
      .status(400)
      .json({ error: 'name, email, and a password of at least 8 characters are required' })
    return
  }

  const [existing] = await pool.query<UserRow[]>(
    'SELECT id FROM users WHERE email = ?',
    [email],
  )
  if (existing.length > 0) {
    res.status(409).json({ error: 'An account with this email already exists' })
    return
  }

  const id = randomUUID()
  const passwordHash = await bcrypt.hash(password, 10)

  await pool.query(
    'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
    [id, name, email, passwordHash],
  )
  const sid = await openSession(id, req)

  const token = signToken({ id, email, sid, role: 'user' })
  res.status(201).json({ token, user: { id, name, email, role: 'user' } })
}))

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {}

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' })
    return
  }

  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
    [email],
  )
  const user = rows[0]
  const passwordMatches = user
    ? await bcrypt.compare(password, user.password_hash)
    : false

  if (!user || !passwordMatches) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  // Starts the grace-period countdown on any other device already signed
  // into this account — it finds out (and can show a countdown warning) on
  // its next request, then requireAuth rejects it once the period elapses.
  const sid = await openSession(user.id, req)

  const token = signToken({ id: user.id, email: user.email, sid, role: user.role })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}))

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, name, email, role FROM users WHERE id = ?',
    [req.user!.id],
  )
  const user = rows[0]
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  // Slide the session forward on every check-in so an actively used app
  // never hits the 7-day hard expiry — only a genuinely abandoned session
  // (no visits for 7 days) actually expires. Re-signed with the same sid:
  // this isn't a new device, so the active session shouldn't change.
  const token = signToken({ id: user.id, email: user.email, sid: req.user!.sid, role: user.role })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}))

authRouter.post('/refresh', requireAuth, asyncHandler(async (req, res) => {
  const token = signToken({
    id: req.user!.id,
    email: req.user!.email,
    sid: req.user!.sid,
    role: req.user!.role,
  })
  res.json({ token })
}))

interface PendingLogoutRow extends RowDataPacket {
  pending_logout_at: Date | null
}

/** Polled by the frontend (while pending_logout_at is still null) to detect
 * a grace-period countdown starting, so it can show a warning banner before
 * requireAuth actually starts rejecting this session. Once a deadline is
 * returned, the frontend counts down locally from that fixed timestamp
 * instead of continuing to poll. */
authRouter.get('/session-status', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query<PendingLogoutRow[]>(
    'SELECT pending_logout_at FROM user_sessions WHERE id = ?',
    [req.user!.sid],
  )
  const pendingLogoutAt = rows[0]?.pending_logout_at ?? null
  res.json({ pendingLogoutAt: pendingLogoutAt ? pendingLogoutAt.toISOString() : null })
}))

authRouter.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  // Ends only this device's own session — other devices signed into the
  // same account are unaffected.
  await pool.query(
    'UPDATE user_sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND ended_at IS NULL',
    [req.user!.sid, req.user!.id],
  )
  res.status(204).end()
}))
