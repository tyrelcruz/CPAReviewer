import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3307),
  user: process.env.DB_USER ?? 'cpa_reviewer',
  password: process.env.DB_PASSWORD ?? 'cpa_reviewer',
  database: process.env.DB_NAME ?? 'cpa_reviewer',
  waitForConnections: true,
  connectionLimit: 10,
})
