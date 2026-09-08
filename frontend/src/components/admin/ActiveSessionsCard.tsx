import { MonitorSmartphone } from 'lucide-react'
import { useEffect, useState } from 'react'

import { listActiveSessions, type AdminSession } from '@/api/admin'
import { formatRelativeTime } from '@/lib/time'

// Live-polled every 15s rather than pushed, since this app has no websocket
// channel — good enough for an admin glance view without adding realtime
// infra just for this card.
const POLL_INTERVAL_MS = 15_000

const AVATAR_PALETTE = ['#7A2323', '#C4707A', '#3A5A40', '#E0AC48', '#3A6B8A', '#6B4A8A']

function avatarColorFor(userId: string): string {
  const sum = [...userId].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function ActiveSessionsCard() {
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    function load() {
      listActiveSessions()
        .then((data) => {
          if (cancelled) return
          setSessions(data.sessions)
          setActiveCount(data.activeCount)
          setError(null)
        })
        .catch(() => {
          if (cancelled) return
          setError('Unable to load sessions. Is the backend running?')
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
    }

    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E0AC48]/15 text-[#B4791F]">
            <MonitorSmartphone className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-[#3A2A1A]">Active Sessions</p>
            <p className="font-reading text-xs text-[#3A2A1A]/60">
              Accounts currently signed in — one device per account, per the session policy.
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#3A5A40]/10 px-3 py-1 text-xs font-semibold text-[#3A5A40]">
          <span className="size-1.5 rounded-full bg-[#3A5A40]" />
          {activeCount} active {activeCount === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-[#7A2323]">{error}</p>
      )}

      {!error && isLoading && (
        <p className="mt-4 text-sm text-[#3A2A1A]/60">Loading sessions…</p>
      )}

      {!error && !isLoading && sessions.length === 0 && (
        <p className="mt-4 text-sm text-[#3A2A1A]/60">No one is currently signed in.</p>
      )}

      {!error && !isLoading && sessions.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#3A2A1A]/10 text-left text-xs text-[#3A2A1A]/60">
                <th className="pb-2 font-semibold">User</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Device</th>
                <th className="pb-2 font-semibold">Location</th>
                <th className="pb-2 font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.sessionId} className="border-b border-[#3A2A1A]/5 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ background: avatarColorFor(session.userId) }}
                      >
                        {initialsFor(session.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#3A2A1A]">{session.name}</p>
                        <p className="truncate text-xs text-[#3A2A1A]/55">{session.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    <span
                      className={
                        session.status === 'active'
                          ? 'flex items-center gap-1.5 text-[#3A5A40]'
                          : 'flex items-center gap-1.5 text-[#3A2A1A]/50'
                      }
                    >
                      <span
                        className={
                          session.status === 'active'
                            ? 'size-1.5 rounded-full bg-[#3A5A40]'
                            : 'size-1.5 rounded-full bg-[#3A2A1A]/30'
                        }
                      />
                      {session.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap text-[#3A2A1A]/80">
                    {session.device}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap text-[#3A2A1A]/80">
                    {session.location ?? 'Unknown'}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap text-[#3A2A1A]/70">
                    {formatRelativeTime(session.lastActiveAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
