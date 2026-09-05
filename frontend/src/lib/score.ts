const GREEN = '#3A5A40'
const GOLD = '#E0AC48'
const MAROON = '#7A2323'

/** Brand color for a percentage score: green (pass), gold (borderline), maroon (fail). */
export function scoreColor(pct: number): string {
  return pct >= 75 ? GREEN : pct >= 50 ? GOLD : MAROON
}

export function scoreBgClass(pct: number): string {
  return pct >= 75 ? 'bg-[#3A5A40]' : pct >= 50 ? 'bg-[#E0AC48]' : 'bg-[#7A2323]'
}
