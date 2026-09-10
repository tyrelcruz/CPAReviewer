import { motion } from 'framer-motion'
import { ArrowLeft, Flag, Folder } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { listFlaggedQuestions, type AdminFlaggedQuestion } from '@/api/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { fadeUpItem, listItem, listStagger, staggerContainer } from '@/lib/motion'
import { SUBJECT_LABELS } from '@/lib/dashboardStats'

const UNKNOWN_SUBJECT_KEY = '__unknown__'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

interface SubjectFolder {
  key: string
  label: string
  flags: AdminFlaggedQuestion[]
}

function groupBySubject(flags: AdminFlaggedQuestion[]): SubjectFolder[] {
  const bySubject = new Map<string, AdminFlaggedQuestion[]>()
  for (const flag of flags) {
    const key = flag.subject ?? UNKNOWN_SUBJECT_KEY
    bySubject.set(key, [...(bySubject.get(key) ?? []), flag])
  }
  return [...bySubject.entries()]
    .map(([key, flagsInSubject]) => ({
      key,
      label: key === UNKNOWN_SUBJECT_KEY ? 'Unknown subject' : (SUBJECT_LABELS[key] ?? key),
      flags: flagsInSubject,
    }))
    .sort((a, b) => b.flags.length - a.flags.length)
}

function FlaggedQuestionsTable({ flags }: { flags: AdminFlaggedQuestion[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[65rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#3A2A1A]/10 text-left text-xs text-[#3A2A1A]/60">
            <th className="pr-3 pb-2 font-semibold">Question</th>
            <th className="pr-3 pb-2 font-semibold">Correct Answer</th>
            <th className="pr-3 pb-2 font-semibold">Learner Suggests</th>
            <th className="pr-3 pb-2 font-semibold">Reason</th>
            <th className="pr-3 pb-2 font-semibold">Flagged by</th>
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
              <td className="max-w-xs py-3 pr-3">
                <p className="font-medium text-[#3A5A40]">{flag.correctAnswer ?? '—'}</p>
              </td>
              <td className="max-w-xs py-3 pr-3">
                {flag.suggestedAnswer ? (
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-[#7A2323]">{flag.suggestedAnswer}</p>
                    {flag.suggestedAnswerIsCustom && (
                      <span className="w-fit rounded-full bg-[#7A2323]/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#7A2323] uppercase">
                        Not in choices
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[#3A2A1A]/40">—</p>
                )}
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
  )
}

const FOLDER_PALETTE = ['#7A2323', '#3A5A40', '#E0AC48', '#3A6B8A', '#6B4A8A', '#C4707A']

function folderColorFor(index: number): string {
  return FOLDER_PALETTE[index % FOLDER_PALETTE.length]
}

export function AdminFlaggedQuestionsPage() {
  const [flags, setFlags] = useState<AdminFlaggedQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

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

  const folders = useMemo(() => groupBySubject(flags), [flags])
  const activeFolder = folders.find((f) => f.key === selectedSubject) ?? null

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
              Questions learners have flagged for review during a quiz, grouped by subject so related
              reports are easy to work through together.
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
                  {(activeFolder?.flags.length ?? flags.length)} flagged{' '}
                  {(activeFolder?.flags.length ?? flags.length) === 1 ? 'report' : 'reports'}
                </p>
                <p className="font-reading text-xs text-[#3A2A1A]/60">
                  {activeFolder
                    ? activeFolder.label
                    : `${folders.length} ${folders.length === 1 ? 'subject' : 'subjects'} · most recent first`}
                </p>
              </div>
            </div>

            {error && <p className="mt-4 text-sm font-medium text-[#7A2323]">{error}</p>}

            {!error && isLoading && (
              <p className="mt-4 text-sm text-[#3A2A1A]/60">Loading flagged questions…</p>
            )}

            {!error && !isLoading && flags.length === 0 && (
              <p className="mt-4 text-sm text-[#3A2A1A]/60">No questions have been flagged yet.</p>
            )}

            {!error && !isLoading && flags.length > 0 && !activeFolder && (
              <motion.div
                variants={listStagger}
                initial="hidden"
                animate="show"
                className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              >
                {folders.map((folder, i) => (
                  <motion.button
                    key={folder.key}
                    type="button"
                    variants={listItem}
                    onClick={() => setSelectedSubject(folder.key)}
                    className="flex flex-col items-start gap-3 rounded-xl border border-[#3A2A1A]/10 bg-[#FBF3EA]/60 p-4 text-left transition-colors hover:bg-[#3A2A1A]/5"
                  >
                    <span
                      className="flex size-11 items-center justify-center rounded-xl"
                      style={{ background: `${folderColorFor(i)}1F`, color: folderColorFor(i) }}
                    >
                      <Folder className="size-5.5 fill-current opacity-90" strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#3A2A1A]">{folder.label}</p>
                      <p className="text-xs text-[#3A2A1A]/60">
                        {folder.flags.length} flagged {folder.flags.length === 1 ? 'question' : 'questions'}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {!error && !isLoading && activeFolder && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedSubject(null)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#7A2323] hover:underline"
                >
                  <ArrowLeft className="size-4" />
                  All subjects
                </button>
                <FlaggedQuestionsTable flags={activeFolder.flags} />
              </div>
            )}
          </motion.div>
        </motion.main>
      </div>
    </div>
  )
}
