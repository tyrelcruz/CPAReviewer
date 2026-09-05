/** Default pacing allowance used to size a quiz's countdown timer. */
export const SECONDS_PER_QUESTION = 90

/** Formats a whole-second duration as HH:MM:SS. */
export function formatClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':')
}
