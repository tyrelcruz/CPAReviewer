import { UAParser } from 'ua-parser-js'
import type { Request } from 'express'

/** "macOS · Chrome", "Windows · Edge", "iOS · Safari" — falls back to just the
 * OS (or a flat "Unknown device") when the browser can't be determined. */
export function describeDevice(userAgent: string | undefined): string {
  if (!userAgent) return 'Unknown device'

  const { os, browser } = UAParser(userAgent)
  const osName = os.name ?? 'Unknown OS'
  return browser.name ? `${osName} · ${browser.name}` : osName
}

/** Prefers the leftmost `X-Forwarded-For` entry (the original client, if this
 * app ever sits behind a proxy/load balancer) over the raw socket address. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
  const ip = first?.trim() || req.socket.remoteAddress || 'unknown'
  // Strip the IPv4-mapped IPv6 prefix (e.g. "::ffff:127.0.0.1") so range
  // checks in geoLocation.ts see the plain IPv4 form.
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip
}
