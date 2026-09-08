import { ArrowUp, FileText, HardDrive, Monitor, User, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { getAdminAnalytics, type AdminAnalytics, type AdminStatWithDelta } from '@/api/admin'
import { fadeUpItem, staggerContainer } from '@/lib/motion'

// Aggregate stats, not a per-second live view — matches AccountUsageCard's
// polling cadence rather than the Active Sessions card's 15s cadence.
const POLL_INTERVAL_MS = 60_000

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

interface DeltaCard {
  key: string
  icon: typeof Users
  label: string
  value: string
  delta: AdminStatWithDelta
}

function buildDeltaCards(analytics: AdminAnalytics): DeltaCard[] {
  return [
    {
      key: 'total-users',
      icon: Users,
      label: 'Total Users',
      value: analytics.stats.totalUsers.value.toLocaleString(),
      delta: analytics.stats.totalUsers,
    },
    {
      key: 'active-users',
      icon: User,
      label: 'Active Users',
      value: analytics.stats.activeUsers.value.toLocaleString(),
      delta: analytics.stats.activeUsers,
    },
    {
      key: 'exams-created',
      icon: FileText,
      label: 'Exams Created',
      value: analytics.stats.examsGenerated.value.toLocaleString(),
      delta: analytics.stats.examsGenerated,
    },
    {
      key: 'active-sessions',
      icon: Monitor,
      label: 'Active Sessions',
      value: analytics.stats.activeSessions.value.toLocaleString(),
      delta: { value: analytics.stats.activeSessions.value, deltaPercent: null },
    },
  ]
}

export function AdminStatCards() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    function load() {
      getAdminAnalytics()
        .then((data) => {
          if (cancelled) return
          setAnalytics(data)
          setError(null)
        })
        .catch(() => {
          if (cancelled) return
          setError('Unable to load platform stats. Is the backend running?')
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

  if (error) {
    return <p className="text-sm font-medium text-[#7A2323]">{error}</p>
  }

  if (isLoading || !analytics) {
    return <p className="text-sm text-[#3A2A1A]/60">Loading platform stats…</p>
  }

  const deltaCards = buildDeltaCards(analytics)

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {deltaCards.map((card) => (
        <motion.div
          key={card.key}
          variants={fadeUpItem}
          className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-[#E0AC48]/15 text-[#B4791F]">
            <card.icon className="size-5" />
          </span>
          <p className="font-reading mt-3 text-sm text-[#3A2A1A]/70">{card.label}</p>
          <p className="mt-0.5 text-2xl font-bold text-[#3A2A1A]">{card.value}</p>

          {card.delta.deltaPercent === null ? (
            <p className="mt-1 text-xs text-[#3A2A1A]/40">Right now</p>
          ) : (
            <p className="mt-1 flex items-center gap-1 text-xs">
              <span
                className={
                  card.delta.deltaPercent >= 0
                    ? 'flex items-center gap-0.5 font-semibold text-[#3A5A40]'
                    : 'flex items-center gap-0.5 font-semibold text-[#7A2323]'
                }
              >
                <ArrowUp className={card.delta.deltaPercent >= 0 ? 'size-3' : 'size-3 rotate-180'} />
                {Math.abs(card.delta.deltaPercent)}%
              </span>
              <span className="text-[#3A2A1A]/50">vs. last 7 days</span>
            </p>
          )}
        </motion.div>
      ))}

      <motion.div
        variants={fadeUpItem}
        className="rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-[#E0AC48]/15 text-[#B4791F]">
          <HardDrive className="size-5" />
        </span>
        <p className="font-reading mt-3 text-sm text-[#3A2A1A]/70">Database Size</p>
        <p className="mt-0.5 text-2xl font-bold text-[#3A2A1A]">
          {formatBytes(analytics.stats.databaseSizeBytes)}
        </p>
        <p className="mt-1 text-xs text-[#3A2A1A]/40">Current size on disk</p>
      </motion.div>
    </motion.div>
  )
}
