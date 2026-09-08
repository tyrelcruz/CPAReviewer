import 'dotenv/config'
import type { RowDataPacket } from 'mysql2'

import { pool } from '../db/pool.js'

// One-off: promotes an existing account to role='admin'. Run against
// whichever database the current .env points at:
//   npx tsx src/scripts/promoteAdmin.ts someone@example.com
// The account must already exist (sign up normally first) — this only
// flips the role, it doesn't create a user.

interface UserRow extends RowDataPacket {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

async function promoteAdmin() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npx tsx src/scripts/promoteAdmin.ts <email>')
    process.exitCode = 1
    return
  }

  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, name, email, role FROM users WHERE email = ?',
    [email],
  )
  const user = rows[0]

  if (!user) {
    console.error(`No account found with email "${email}". Sign up first, then re-run this.`)
    process.exitCode = 1
    return
  }

  if (user.role === 'admin') {
    console.log(`"${email}" (${user.name}) is already an admin — nothing to do.`)
    return
  }

  await pool.query('UPDATE users SET role = ? WHERE id = ?', ['admin', user.id])
  console.log(`Promoted "${email}" (${user.name}) to admin.`)
}

promoteAdmin()
  .catch((err) => {
    console.error('Failed to promote user:', err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
