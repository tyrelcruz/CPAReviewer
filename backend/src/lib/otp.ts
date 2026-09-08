import { createHash, randomInt } from 'node:crypto'

/** A fast hash is fine here (unlike password_hash's bcrypt) — codes are
 * random, single-use, expire in minutes, and verify attempts are capped
 * server-side, so there's no long-term offline-brute-force surface to
 * defend against the way there is for a reused password. */
export function hashOtpCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export const OTP_TTL_MINUTES = 10
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 60
