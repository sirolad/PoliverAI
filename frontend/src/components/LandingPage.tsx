import React from 'react'
import { twFromTokens, colors, spacing } from '@/styles/styleTokens'
// ...existing code...
// ...existing code...
import useAuth from '@/contexts/useAuth'
// ...existing code...
import HeroSection from './HeroSection'
import FeaturesSection from './FeaturesSection'
import Footer from './Footer'
import ConditionalSplash from './ui/ConditionalSplash'
// ...existing code...
import TeamCarousel from './team/TeamCarousel'
import AppPlatforms from './AppPlatforms'
import HowItWorks from './HowItWorks'
import PricingSection from './PricingSection'
import CTASection from './CTASection'
import TeamWriteup from './TeamWriteup'


export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  // ...existing code...
  const [showSplash, setShowSplash] = React.useState(true)

  

  return (
    <div className={twFromTokens('min-h-screen', colors.pageGradient)}>
      <ConditionalSplash show={showSplash} onFinish={() => setShowSplash(false)} delayMs={200} durationMs={5000} />
      <HeroSection />

      {/* App platforms / download stats section */}
      <div className={twFromTokens(spacing.sectionContainer)}>
        <AppPlatforms />
      </div>

      <FeaturesSection />

      <HowItWorks />

      <PricingSection />

      {/* CTA Section */}
      {!isAuthenticated && <CTASection />}

      {/* Team carousel */}
      <TeamCarousel />
      <TeamWriteup />

      {/* Footer specifically for the landing page: match CTA section's background */}
      <Footer hasBackground={true} />
    </div>
  )
}
