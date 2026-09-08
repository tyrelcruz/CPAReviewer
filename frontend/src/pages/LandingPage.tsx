import { ChooseYourStrategySection } from '@/components/landing/ChooseYourStrategySection'
import { HeroSection } from '@/components/landing/HeroSection'
import { HowItWorksSteps } from '@/components/landing/HowItWorksSteps'
import { Navbar } from '@/components/landing/Navbar'
import { WhyKabisSection } from '@/components/landing/WhyKabisSection'

export function LandingPage() {
  return (
    <div className="min-h-svh bg-[#F3ECDC] text-[#3A2A1A]">
      <Navbar />
      <HeroSection />
      <WhyKabisSection />
      <ChooseYourStrategySection />
      <HowItWorksSteps />
    </div>
  )
}
