import { readFileSync } from 'node:fs'
import mysql from 'mysql2/promise'

const sslCa = process.env.DB_SSL_CA
  ? process.env.DB_SSL_CA
  : process.env.DB_SSL_CA_PATH
    ? readFileSync(process.env.DB_SSL_CA_PATH, 'utf-8')
    : undefined

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3307),
  user: process.env.DB_USER ?? 'cpa_reviewer',
  password: process.env.DB_PASSWORD ?? 'cpa_reviewer',
  database: process.env.DB_NAME ?? 'cpa_reviewer',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: sslCa ? { ca: sslCa } : undefined,
  // The docker-compose MySQL container runs with time_zone=SYSTEM, which is
  // UTC for the stock mysql:8.4 image (no tzdata installed) — telling mysql2
  // the server is UTC ('Z') makes it parse TIMESTAMP/DATETIME columns as UTC
  // instead of the Node process's own local timezone, which otherwise skews
  // every date it returns by the host's UTC offset (an 8-hour bug here).
  timezone: 'Z',
})
