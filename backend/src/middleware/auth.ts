import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { RowDataPacket } from 'mysql2'

import { pool } from '../db/pool.js'

export type Role = 'user' | 'admin'

export interface AuthUser {
  id: string
  email: string
  /** Session id — must be an open (not superseded/logged-out) row in
   * `user_sessions`, checked on every request by requireAuth. */
  sid: string
  role: Role
}

/** Heartbeat throttle: last_seen_at only gets written this often per session,
 * not on every single request, so an actively-browsing tab doesn't turn into
 * a write on every API call. */
const LAST_SEEN_THROTTLE_MS = 60 * 1000

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production'

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

interface SessionRow extends RowDataPacket {
  ended_at: Date | null
  last_seen_at: Date
  role: Role
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  let payload: AuthUser
  try {
    payload = jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  try {
    const [rows] = await pool.query<SessionRow[]>(
      `SELECT s.ended_at AS ended_at, s.last_seen_at AS last_seen_at, u.role AS role
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.user_id = ?`,
      [payload.sid, payload.id],
    )
    const row = rows[0]

    if (!row || row.ended_at) {
      res.status(401).json({
        error: 'This account was signed in on another device',
        code: 'SESSION_SUPERSEDED',
      })
      return
    }

    // Read role fresh from the DB rather than trusting the token's claim, so
    // a promotion/demotion takes effect on this user's very next request
    // instead of waiting for their token to be re-signed.
    req.user = { ...payload, role: row.role }
    next()

    // Fire-and-forget activity heartbeat, throttled so an actively-browsing
    // session doesn't write on every single request — powers the admin
    // "Active Sessions" active-vs-inactive status. Runs after next() so it
    // never adds latency to the response.
    if (Date.now() - row.last_seen_at.getTime() > LAST_SEEN_THROTTLE_MS) {
      pool
        .query('UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?', [
          payload.sid,
        ])
        .catch((err) => console.error('Failed to update session last_seen_at:', err))
    }
  } catch (err) {
    next(err)
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}
