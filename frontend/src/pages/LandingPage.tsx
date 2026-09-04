import { HeroSection } from '@/components/landing/HeroSection'
import { Navbar } from '@/components/landing/Navbar'
import { StudySmarterSection } from '@/components/landing/StudySmarterSection'

export function LandingPage() {
  return (
    <div className="min-h-svh bg-[#F3ECDC] text-[#3A2A1A]">
      <Navbar />
      <HeroSection />
      <StudySmarterSection />
    </div>
  )
}
