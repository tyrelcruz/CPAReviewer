// Resolves a login IP to a human-readable "City, Country" label for the
// admin "Active Sessions" view. Uses ip-api.com's free, keyless JSON endpoint
// — no signup, no secret to configure — which is a reasonable fit for a
// low-volume internal admin tool. It's plain HTTP (not HTTPS) and rate-limited
// (45 req/min) on the free tier, so lookups are cached in memory by IP and
// every call is best-effort: a slow/failed/rate-limited lookup returns null
// rather than ever blocking or failing a login.

const LOOKUP_TIMEOUT_MS = 2500
const SUCCESS_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour — logins from the same IP are common (same office/campus Wi-Fi)
const FAILURE_CACHE_TTL_MS = 60 * 1000 // short-lived, so a transient error/rate-limit self-heals quickly

interface CacheEntry {
  label: string | null
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

function isPrivateOrLoopback(ip: string): boolean {
  if (ip === 'unknown' || ip === '::1' || ip === 'localhost') return true
  if (ip.startsWith('127.') || ip.startsWith('169.254.')) return true
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true

  const secondOctet = ip.startsWith('172.') ? Number(ip.split('.')[1]) : NaN
  if (secondOctet >= 16 && secondOctet <= 31) return true

  return false
}

interface IpApiResponse {
  status: 'success' | 'fail'
  city?: string
  regionName?: string
  country?: string
}

/** Best-effort — never throws. Returns null when the IP is private/loopback
 * (nothing to resolve) or the lookup didn't succeed in time. */
export async function resolveLocation(ip: string): Promise<string | null> {
  if (isPrivateOrLoopback(ip)) return 'Local network'

  const cached = cache.get(ip)
  if (cached && cached.expiresAt > Date.now()) return cached.label

  let label: string | null = null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`,
      { signal: controller.signal },
    )
    clearTimeout(timeout)
    const data = (await res.json()) as IpApiResponse
    if (data.status === 'success') {
      label = [data.city, data.country].filter(Boolean).join(', ') || data.regionName || null
    }
  } catch {
    // Network error, timeout, or rate-limit — leave label as null.
  }

  const ttl = label ? SUCCESS_CACHE_TTL_MS : FAILURE_CACHE_TTL_MS
  cache.set(ip, { label, expiresAt: Date.now() + ttl })
  return label
}
