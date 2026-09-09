/** Default pacing allowance used to size a quiz's countdown timer. */
export const SECONDS_PER_QUESTION = 90

/** Formats a whole-second duration as HH:MM:SS. */
export function formatClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':')
}

/** Formats an ISO timestamp as "2m ago" / "3h ago" / "5d ago" relative to now. */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000))

  if (diffSeconds < 60) return 'just now'
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/** Formats a Date as a local YYYY-MM-DD key (not UTC — avoids the day
 * rolling back/forward for users west/east of UTC that `toISOString` would
 * cause), for grouping records by calendar day. */
export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Returns a new Date `days` days after (or before, if negative) `date`. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Returns a new Date `months` months after (or before, if negative) `date`. */
export function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

/** Formats a whole-second duration compactly, e.g. "45s", "18m", "1h 12m". */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 1) return `${Math.round(totalSeconds)}s`
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}
