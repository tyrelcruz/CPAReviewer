import { Navbar } from '@/components/landing/Navbar'
import { SubjectsSection } from '@/components/landing/SubjectsSection'

export function SubjectsPage() {
  return (
    <div className="min-h-svh bg-[#F3ECDC] text-[#3A2A1A]">
      <Navbar />
      <SubjectsSection />
    </div>
  )
}
