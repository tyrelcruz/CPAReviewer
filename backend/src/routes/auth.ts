import bcrypt from 'bcryptjs'
import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'

import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, signToken } from '../middleware/auth.js'

export const authRouter = Router()

interface UserRow extends RowDataPacket {
  id: string
  name: string
  email: string
  password_hash: string
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

  const token = signToken({ id, email })
  res.status(201).json({ token, user: { id, name, email } })
}))

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {}

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' })
    return
  }

  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, name, email, password_hash FROM users WHERE email = ?',
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

  const token = signToken({ id: user.id, email: user.email })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
}))

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, name, email FROM users WHERE id = ?',
    [req.user!.id],
  )
  const user = rows[0]
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  // Slide the session forward on every check-in so an actively used app
  // never hits the 7-day hard expiry — only a genuinely abandoned session
  // (no visits for 7 days) actually expires.
  const token = signToken({ id: user.id, email: user.email })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
}))

authRouter.post('/refresh', requireAuth, asyncHandler(async (req, res) => {
  const token = signToken({ id: req.user!.id, email: req.user!.email })
  res.json({ token })
}))
