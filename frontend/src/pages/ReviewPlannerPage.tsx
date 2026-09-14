import { useMemo, useState } from 'react'

import { AddPlanEntryModal } from '@/components/dashboard/AddPlanEntryModal'
import { MobileTabBar } from '@/components/dashboard/MobileTabBar'
import { ProgressPanel } from '@/components/dashboard/ProgressPanel'
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar'
import { ReviewCalendarCard, type CalendarViewMode } from '@/components/dashboard/ReviewCalendarCard'
import { ReviewPlannerHero } from '@/components/dashboard/ReviewPlannerHero'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { UpcomingPanel } from '@/components/dashboard/UpcomingPanel'
import { useAuth } from '@/context/AuthContext'
import { usePlanner } from '@/context/PlannerContext'
import { dateKey } from '@/lib/time'
import { getCourseLabel, getInitials } from '@/lib/userDisplay'
import type { ReviewPlanEntryType } from '@/lib/reviewPlanner'

export function ReviewPlannerPage() {
  const { user } = useAuth()
  const todayKey = useMemo(() => dateKey(new Date()), [])

  const { entries, addEntry, toggleDone } = usePlanner()
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDefaultType, setModalDefaultType] = useState<ReviewPlanEntryType>('Review')

  const initials = getInitials(user?.name ?? '?')
  const roleLabel = getCourseLabel(user?.course ?? 'cpa')

  function openAddModal(type: ReviewPlanEntryType) {
    setModalDefaultType(type)
    setModalOpen(true)
  }

  function handleAddEntry(entry: { title: string; type: ReviewPlanEntryType; date: string; time?: string }) {
    addEntry(entry)
    setSelectedDate(entry.date)
    setModalOpen(false)
  }

  function drillIntoDay(key: string) {
    setSelectedDate(key)
    setViewMode('day')
  }

  return (
    <div className="flex min-h-svh bg-[#FBF3EA] text-[#3A2A1A]">
      <Sidebar showMobileMenu={false} />

      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
          <ReviewPlannerHero initials={initials} name={user?.name ?? 'Reviewer'} roleLabel={roleLabel} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <ReviewCalendarCard
              entries={entries}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              onDrillIntoDay={drillIntoDay}
              onToggleDone={toggleDone}
              onAddClick={() => openAddModal('Review')}
            />

            <div className="flex flex-col gap-6">
              <UpcomingPanel entries={entries} onSelect={drillIntoDay} />
              <ProgressPanel entries={entries} />
            </div>
          </div>

          <QuickActionsBar onAdd={openAddModal} onViewStudyPlan={() => drillIntoDay(todayKey)} />
        </main>
      </div>

      <MobileTabBar />

      <AddPlanEntryModal
        open={modalOpen}
        defaultType={modalDefaultType}
        defaultDate={selectedDate}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddEntry}
      />
    </div>
  )
}
