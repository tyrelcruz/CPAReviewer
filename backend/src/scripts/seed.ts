import 'dotenv/config'
import { randomUUID } from 'node:crypto'

import { pool } from '../db/pool.js'

const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@cpareviewer.test',
}

const ADMIN_USER = {
  name: 'Admin User',
  email: 'admin@cpareviewer.test',
}

/** Auth is OTP-only (see routes/auth.ts) — there's no password to seed.
 * Sign in as either account by requesting a login code for its email; with
 * no SMTP configured locally, the code is printed to this server's console
 * instead of emailed. */
async function seed() {
  await pool.query(
    `INSERT INTO users (id, name, email)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [randomUUID(), DEMO_USER.name, DEMO_USER.email],
  )
  console.log(`Seeded demo user "${DEMO_USER.email}".`)

  await pool.query(
    `INSERT INTO users (id, name, email, role)
     VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name), role = 'admin'`,
    [randomUUID(), ADMIN_USER.name, ADMIN_USER.email],
  )
  console.log(`Seeded admin user "${ADMIN_USER.email}".`)

  await pool.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
