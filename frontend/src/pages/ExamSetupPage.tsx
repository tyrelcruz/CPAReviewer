import { motion } from 'framer-motion'
import { ClipboardList, Layers, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { generateExam } from '@/api/exams'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { fadeUpItem, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { ExamMode } from '@/types/bank'

// Only RFBT is ingested today (ReSA + REO + CPAR question banks) — extend
// this list as more subjects/centers are ingested via `npm run db:ingest`.
const SUBJECTS = ['RFBT']
const REVIEW_CENTERS = [
  'ReSA - The Review School of Accountancy',
  'REO CPA Review (Real Excellence Online)',
  'CPA Review School of the Philippines (CPAR)',
]
const ITEM_COUNT_OPTIONS = [25, 50, 70, 100]

export function ExamSetupPage() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [mode, setMode] = useState<ExamMode>('tos_simulator')
  const [center, setCenter] = useState(REVIEW_CENTERS[0])
  const [itemCount, setItemCount] = useState(70)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setError(null)
    setIsGenerating(true)
    try {
      const session = await generateExam({
        subject,
        mode,
        itemCount,
        center: mode === 'review_center_drill' ? center : undefined,
      })
      navigate(`/app/exam/${session.sessionId}`, { state: { notice: session.notice ?? null } })
    } catch {
      setError('Could not generate an exam right now. Please try again.')
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
            <motion.div variants={fadeUpItem}>
              <h1 className="font-display text-2xl text-[#7A2323] sm:text-3xl">New Question Bank Exam</h1>
              <p className="font-reading mt-1 text-sm text-[#3A2A1A]/70">
                Assemble a fresh set from the cross-center RFBT question bank — matched to the
                PRC table of specifications, or drilled to one review center.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUpItem}
              className="flex flex-col gap-2 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
            >
              <label className="text-xs font-semibold text-[#3A2A1A]/60">Subject</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                      subject === s
                        ? 'border-transparent bg-[#3A5A40] text-white'
                        : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeUpItem}
              className="flex flex-col gap-3 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
            >
              <label className="text-xs font-semibold text-[#3A2A1A]/60">Mode</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode('tos_simulator')}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                    mode === 'tos_simulator'
                      ? 'border-[#7A2323] bg-[#7A2323]/5'
                      : 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5',
                  )}
                >
                  <ClipboardList className="mt-0.5 size-5 shrink-0 text-[#7A2323]" />
                  <div>
                    <p className="text-sm font-bold text-[#3A2A1A]">TOS Simulator Mode</p>
                    <p className="font-reading mt-1 text-xs text-[#3A2A1A]/70">
                      Assembled to PRC TOS difficulty ratios (30% Easy / 40% Moderate / 30%
                      Difficult) across every source center.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('review_center_drill')}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                    mode === 'review_center_drill'
                      ? 'border-[#7A2323] bg-[#7A2323]/5'
                      : 'border-[#3A2A1A]/15 hover:bg-[#3A2A1A]/5',
                  )}
                >
                  <Layers className="mt-0.5 size-5 shrink-0 text-[#7A2323]" />
                  <div>
                    <p className="text-sm font-bold text-[#3A2A1A]">Review Center Drill Mode</p>
                    <p className="font-reading mt-1 text-xs text-[#3A2A1A]/70">
                      Practice only questions unique to one review center.
                    </p>
                  </div>
                </button>
              </div>

              {mode === 'review_center_drill' && (
                <div className="flex flex-col gap-1.5 border-t border-[#3A2A1A]/10 pt-3">
                  <label className="text-xs font-semibold text-[#3A2A1A]/60">Review Center</label>
                  <select
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    className="w-full rounded-xl border border-[#3A2A1A]/15 bg-white py-2.5 px-3.5 text-sm font-medium text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
                  >
                    {REVIEW_CENTERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </motion.div>

            <motion.div
              variants={fadeUpItem}
              className="flex flex-col gap-2 rounded-2xl border border-[#3A2A1A]/10 bg-white p-5"
            >
              <label className="text-xs font-semibold text-[#3A2A1A]/60">Item Count</label>
              <div className="flex flex-wrap gap-2">
                {ITEM_COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setItemCount(n)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                      itemCount === n
                        ? 'border-transparent bg-[#E0AC48] text-[#3A2A1A]'
                        : 'border-[#3A2A1A]/15 text-[#3A2A1A]/80 hover:bg-[#3A2A1A]/5',
                    )}
                  >
                    {n} items
                  </button>
                ))}
              </div>
            </motion.div>

            {error && (
              <motion.p variants={fadeUpItem} className="text-sm font-semibold text-[#7A2323]">
                {error}
              </motion.p>
            )}

            <motion.button
              variants={fadeUpItem}
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 rounded-full bg-[#7A2323] px-6 py-3.5 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating && <Loader2 className="size-4 animate-spin" />}
              {isGenerating ? 'Generating…' : 'Generate Exam'}
            </motion.button>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
