import type { Request } from 'express'
import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'

import { describeDevice, getClientIp } from '../lib/deviceInfo.js'
import { resolveLocation } from '../lib/geoLocation.js'
import { sendOtpEmail } from '../lib/mailer.js'
import {
  generateOtpCode,
  hashOtpCode,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
} from '../lib/otp.js'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, signToken } from '../middleware/auth.js'

export const authRouter = Router()

// How long another device's session stays valid, showing a countdown
// warning, after this account logs in somewhere new — only one device may
// be active per account, but this gives the previous one a moment to notice
// rather than an instant silent kick.
const GRACE_PERIOD_SECONDS = 30

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Dev convenience: emails listed in OTP_BYPASS_EMAILS skip real OTP delivery
// and verification on /login entirely, so testing as these accounts doesn't
// burn EmailJS send quota. Unset (the default) means no bypass — never set
// this in a production .env.
const OTP_BYPASS_EMAILS = new Set(
  (process.env.OTP_BYPASS_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)
if (OTP_BYPASS_EMAILS.size > 0) {
  console.warn(
    `[auth] OTP bypass active for ${OTP_BYPASS_EMAILS.size} email(s) — dev only, never enable in production.`,
  )
}

interface UserRow extends RowDataPacket {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  course: 'cpa' | 'rmt'
}

interface OtpRow extends RowDataPacket {
  email: string
  code_hash: string
  purpose: 'signup' | 'login'
  pending_name: string | null
  pending_course: 'cpa' | 'rmt' | null
  attempts: number
  expires_at: Date
  created_at: Date
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

/** Generates and emails a fresh OTP for `email`, replacing any still-pending
 * one for that address. Enforces a per-email resend cooldown so a single
 * email address can't be spammed with requests. Returns false (without
 * sending) if the cooldown hasn't elapsed yet. */
async function issueOtp(
  email: string,
  purpose: 'signup' | 'login',
  pendingName: string | null,
  pendingCourse: 'cpa' | 'rmt' | null,
): Promise<boolean> {
  const [existingRows] = await pool.query<OtpRow[]>(
    'SELECT created_at FROM otp_codes WHERE email = ?',
    [email],
  )
  const existing = existingRows[0]
  if (existing) {
    const secondsSinceLast = (Date.now() - existing.created_at.getTime()) / 1000
    if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) return false
  }

  const code = generateOtpCode()
  await pool.query(
    `INSERT INTO otp_codes (email, code_hash, purpose, pending_name, pending_course, attempts, expires_at)
     VALUES (?, ?, ?, ?, ?, 0, (CURRENT_TIMESTAMP + INTERVAL ? MINUTE))
     ON DUPLICATE KEY UPDATE
       code_hash = VALUES(code_hash),
       purpose = VALUES(purpose),
       pending_name = VALUES(pending_name),
       pending_course = VALUES(pending_course),
       attempts = 0,
       expires_at = VALUES(expires_at),
       created_at = CURRENT_TIMESTAMP`,
    [email, hashOtpCode(code), purpose, pendingName, pendingCourse, OTP_TTL_MINUTES],
  )

  await sendOtpEmail(email, code)
  return true
}

/** Looks up and validates a pending OTP for `email`/`purpose`, incrementing
 * the attempt counter on a mismatch. Returns the row on success so the
 * caller can act on `pending_name`, or an error to send back otherwise. */
async function consumeOtp(
  email: string,
  purpose: 'signup' | 'login',
  code: string,
): Promise<{ ok: true; row: OtpRow } | { ok: false; status: number; error: string }> {
  const [rows] = await pool.query<OtpRow[]>('SELECT * FROM otp_codes WHERE email = ?', [email])
  const row = rows[0]

  if (!row || row.purpose !== purpose) {
    return { ok: false, status: 400, error: 'No pending code for this email — request a new one.' }
  }
  if (row.expires_at.getTime() < Date.now()) {
    await pool.query('DELETE FROM otp_codes WHERE email = ?', [email])
    return { ok: false, status: 400, error: 'This code has expired — request a new one.' }
  }
  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    await pool.query('DELETE FROM otp_codes WHERE email = ?', [email])
    return { ok: false, status: 429, error: 'Too many incorrect attempts — request a new code.' }
  }
  if (hashOtpCode(code) !== row.code_hash) {
    await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE email = ?', [email])
    return { ok: false, status: 401, error: 'Incorrect code.' }
  }

  await pool.query('DELETE FROM otp_codes WHERE email = ?', [email])
  return { ok: true, row }
}

authRouter.post('/signup/request-otp', asyncHandler(async (req, res) => {
  const { name, email, course } = req.body ?? {}

  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: 'A name and a valid email are required' })
    return
  }
  if (course !== 'cpa' && course !== 'rmt') {
    res.status(400).json({ error: 'course must be "cpa" or "rmt"' })
    return
  }

  const [existing] = await pool.query<UserRow[]>('SELECT id FROM users WHERE email = ?', [email])
  if (existing.length > 0) {
    res.status(409).json({ error: 'An account with this email already exists' })
    return
  }

  const sent = await issueOtp(email, 'signup', name.trim(), course)
  if (!sent) {
    res.status(429).json({ error: `Please wait before requesting another code.` })
    return
  }
  res.status(200).json({ message: 'Verification code sent' })
}))

authRouter.post('/signup/verify-otp', asyncHandler(async (req, res) => {
  const { email, code } = req.body ?? {}

  if (typeof email !== 'string' || typeof code !== 'string') {
    res.status(400).json({ error: 'email and code are required' })
    return
  }

  const result = await consumeOtp(email, 'signup', code)
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }

  const [existing] = await pool.query<UserRow[]>('SELECT id FROM users WHERE email = ?', [email])
  if (existing.length > 0) {
    res.status(409).json({ error: 'An account with this email already exists' })
    return
  }

  const id = randomUUID()
  const name = result.row.pending_name ?? email
  const course = result.row.pending_course ?? 'cpa'
  await pool.query('INSERT INTO users (id, name, email, course) VALUES (?, ?, ?, ?)', [
    id,
    name,
    email,
    course,
  ])

  const sid = await openSession(id, req)
  const token = signToken({ id, email, sid, role: 'user', course })
  res.status(201).json({ token, user: { id, name, email, role: 'user', course } })
}))

authRouter.post('/login/request-otp', asyncHandler(async (req, res) => {
  const { email } = req.body ?? {}

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: 'A valid email is required' })
    return
  }

  const [rows] = await pool.query<UserRow[]>('SELECT id FROM users WHERE email = ?', [email])
  if (rows.length === 0) {
    res.status(404).json({ error: 'No account found with this email' })
    return
  }

  if (OTP_BYPASS_EMAILS.has(email.toLowerCase())) {
    res.status(200).json({ message: 'Verification code sent' })
    return
  }

  const sent = await issueOtp(email, 'login', null, null)
  if (!sent) {
    res.status(429).json({ error: `Please wait before requesting another code.` })
    return
  }
  res.status(200).json({ message: 'Verification code sent' })
}))

authRouter.post('/login/verify-otp', asyncHandler(async (req, res) => {
  const { email, code } = req.body ?? {}

  if (typeof email !== 'string' || typeof code !== 'string') {
    res.status(400).json({ error: 'email and code are required' })
    return
  }

  if (!OTP_BYPASS_EMAILS.has(email.toLowerCase())) {
    const result = await consumeOtp(email, 'login', code)
    if (!result.ok) {
      res.status(result.status).json({ error: result.error })
      return
    }
  }

  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, name, email, role, course FROM users WHERE email = ?',
    [email],
  )
  const user = rows[0]
  if (!user) {
    res.status(404).json({ error: 'No account found with this email' })
    return
  }

  // Starts the grace-period countdown on any other device already signed
  // into this account — it finds out (and can show a countdown warning) on
  // its next request, then requireAuth rejects it once the period elapses.
  const sid = await openSession(user.id, req)

  const token = signToken({ id: user.id, email: user.email, sid, role: user.role, course: user.course })
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, course: user.course },
  })
}))

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, name, email, role, course FROM users WHERE id = ?',
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
  const token = signToken({
    id: user.id,
    email: user.email,
    sid: req.user!.sid,
    role: user.role,
    course: user.course,
  })
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, course: user.course },
  })
}))

authRouter.post('/refresh', requireAuth, asyncHandler(async (req, res) => {
  const token = signToken({
    id: req.user!.id,
    email: req.user!.email,
    sid: req.user!.sid,
    role: req.user!.role,
    course: req.user!.course,
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
