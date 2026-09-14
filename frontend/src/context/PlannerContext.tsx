import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

import { useAuth } from '@/context/AuthContext'
import {
  addReviewPlanEntry,
  deleteReviewPlanEntry,
  getReviewPlanEntries,
  toggleReviewPlanEntryDone,
  type ReviewPlanEntry,
  type ReviewPlanEntryType,
} from '@/lib/reviewPlanner'

interface PlannerContextValue {
  entries: ReviewPlanEntry[]
  addEntry: (entry: { title: string; type: ReviewPlanEntryType; date: string; time?: string }) => void
  toggleDone: (id: string) => void
  deleteEntry: (id: string) => void
}

const PlannerContext = createContext<PlannerContextValue | null>(null)

// Single source of truth for review-plan entries (localStorage-backed) so
// pages that both read and mutate them — ReviewPlannerPage and the
// dashboard's StudyPlanCard — stay in sync without a stale second copy.
export function PlannerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [entries, setEntries] = useState<ReviewPlanEntry[]>(() => getReviewPlanEntries(userId))

  useEffect(() => {
    setEntries(getReviewPlanEntries(userId))
  }, [userId])

  function addEntry(entry: { title: string; type: ReviewPlanEntryType; date: string; time?: string }) {
    setEntries(addReviewPlanEntry(userId, entry))
  }

  function toggleDone(id: string) {
    setEntries(toggleReviewPlanEntryDone(userId, id))
  }

  function deleteEntry(id: string) {
    setEntries(deleteReviewPlanEntry(userId, id))
  }

  return (
    <PlannerContext.Provider value={{ entries, addEntry, toggleDone, deleteEntry }}>
      {children}
    </PlannerContext.Provider>
  )
}

export function usePlanner() {
  const context = useContext(PlannerContext)
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider')
  }
  return context
}
