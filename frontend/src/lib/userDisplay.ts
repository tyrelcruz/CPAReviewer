/** Up to two uppercase initials derived from a display name, e.g. "Juan Cruz" → "JC". */
export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return initials || '?'
}

