import { motion } from 'framer-motion'
import { Flag } from 'lucide-react'
import { useEffect, useState } from 'react'

import { listFlaggedQuestions, type AdminFlaggedQuestion } from '@/api/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { fadeUpItem, staggerContainer } from '@/lib/motion'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AdminFlaggedQuestionsPage() {
  const [flags, setFlags] = useState<AdminFlaggedQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listFlaggedQuestions()
      .then((data) => {
        if (cancelled) return
        setFlags(data.flags)
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setError('Unable to load flagged questions. Is the backend running?')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <motion.main
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8"
        >
          <motion.div variants={fadeUpItem}>
            <h1 className="font-serif text-3xl font-bold text-[#7A2323] sm:text-4xl">
              Flagged Questions
            </h1>
            <p className="font-reading mt-1.5 max-w-lg text-sm text-[#3A2A1A]/70">
              Questions learners have flagged for review during a quiz, along with the reason they gave.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUpItem}
            className="min-w-0 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7A2323]/10 text-[#7A2323]">
                <Flag className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-[#3A2A1A]">
                  {flags.length} flagged {flags.length === 1 ? 'report' : 'reports'}
                </p>
                <p className="font-reading text-xs text-[#3A2A1A]/60">Most recent first.</p>
              </div>
            </div>

            {error && <p className="mt-4 text-sm font-medium text-[#7A2323]">{error}</p>}

            {!error && isLoading && (
              <p className="mt-4 text-sm text-[#3A2A1A]/60">Loading flagged questions…</p>
            )}

            {!error && !isLoading && flags.length === 0 && (
              <p className="mt-4 text-sm text-[#3A2A1A]/60">No questions have been flagged yet.</p>
            )}

            {!error && !isLoading && flags.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[55rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#3A2A1A]/10 text-left text-xs text-[#3A2A1A]/60">
                      <th className="pb-2 font-semibold">Question</th>
                      <th className="pb-2 font-semibold">Subject</th>
                      <th className="pb-2 font-semibold">Reason</th>
                      <th className="pb-2 font-semibold">Flagged by</th>
                      <th className="pb-2 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flags.map((flag) => (
                      <tr key={flag.id} className="border-b border-[#3A2A1A]/5 align-top last:border-0">
                        <td className="max-w-xs py-3 pr-3">
                          {flag.prompt ? (
                            <p className="line-clamp-2 text-[#3A2A1A]/85">{flag.prompt}</p>
                          ) : (
                            <p className="text-[#3A2A1A]/40 italic">Question no longer available</p>
                          )}
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-[#3A2A1A]/70">
                          {flag.subject ?? '—'}
                        </td>
                        <td className="max-w-sm py-3 pr-3">
                          <p className="text-[#3A2A1A]/85">{flag.reason}</p>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          <p className="font-medium text-[#3A2A1A]">{flag.flaggedByName}</p>
                          <p className="text-xs text-[#3A2A1A]/55">{flag.flaggedByEmail}</p>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap text-[#3A2A1A]/70">
                          {formatDate(flag.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.main>
      </div>
    </div>
  )
}
