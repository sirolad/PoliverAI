import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import useAuth from '@/contexts/useAuth'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Zap, Clock, BarChart, CreditCard, Grid } from 'lucide-react'
import Footer from './Footer'
import ConditionalSplash from './ui/ConditionalSplash'
import { getFreeFeatures, getProFeatures } from '@/lib/landingHelpers'
import TeamCarousel from './team/TeamCarousel'
import AppPlatforms from './AppPlatforms'

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
  isPro?: boolean
}

function FeatureCard({ icon: Icon, title, description, isPro = false }: FeatureCardProps) {
  return (
    <Card className={`h-full ${isPro ? 'border-blue-200 bg-blue-50/50' : ''}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className={`h-6 w-6 ${isPro ? 'text-blue-600' : 'text-green-600'}`} />
          <CardTitle className="text-lg">{title}</CardTitle>
          {isPro && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">PRO</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isProcessing] = React.useState(false)
  const [showSplash, setShowSplash] = React.useState(true)

  const freeFeatures = getFreeFeatures()
  const proFeatures = getProFeatures()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
  <ConditionalSplash show={showSplash} onFinish={() => setShowSplash(false)} delayMs={200} durationMs={1600} />
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <img src="/poliverai-logo.svg" alt="PoliverAI" className="mx-auto" />
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your <span className="text-blue-600">AI-Powered</span> GDPR Compliance Assistant
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Automatically analyze privacy policies for GDPR compliance, detect violations,
            and generate comprehensive reports with AI-powered insights.
          </p>
          <div className="flex gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate('/signup')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                  icon={<Clock className="h-5 w-5" />}
                  collapseToIcon
                >
                  Start Free Analysis
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  icon={<CreditCard className="h-5 w-5" />}
                  collapseToIcon
                >
                  {isProcessing ? 'Processing...' : 'Upgrade to Pro'}
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                icon={<Grid className="h-5 w-5" />}
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            )}
          </div>

          {/* Andela partnership badge */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="text-lg text-gray-600">An </div><img src="/andela-logo-transparent.png" alt="Andela" className="h-10" /><div className="text-lg text-gray-600"> initiative — designed in partnership with Andela</div>
          </div>
        </div>
      </div>

      {/* App platforms / download stats section */}
      <div className="container mx-auto px-4">
        <AppPlatforms />
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Features for Every Need
          </h2>
          <p className="text-lg text-gray-600">
            From basic compliance checks to advanced AI-powered analysis
          </p>
        </div>

        {/* Free Features */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Free Tier Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {freeFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Pro Features */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Pro Tier Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {proFeatures.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How PoliverAI Works
            </h2>
            <p className="text-lg text-gray-600">
              Simple, powerful, and intelligent GDPR compliance analysis
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Policy</h3>
              <p className="text-gray-600">Upload privacy policies in multiple formats (PDF, DOCX, TXT, HTML)</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">Our AI analyzes your policy against GDPR requirements with multiple analysis modes</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Results</h3>
              <p className="text-gray-600">Receive detailed reports with compliance scores, violations, and actionable recommendations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-600">
            Start with our free tier or upgrade for advanced AI features
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="h-full">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Free Tier</CardTitle>
              <div className="text-4xl font-bold text-green-600 mt-2">$0</div>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Basic policy verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Rule-based compliance checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Fast analysis mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Basic recommendations</span>
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline" onClick={() => navigate('/signup')} icon={<Clock className="h-4 w-4" />} collapseToIcon>
                Get Started Free
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="h-full border-blue-200 bg-blue-50/30">
            <CardHeader className="text-center pb-2">
              <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full w-fit mx-auto mb-2">
                POPULAR
              </div>
              <CardTitle className="text-2xl">Pro Tier</CardTitle>
              <div className="text-4xl font-bold text-blue-600 mt-2">$29</div>
              <CardDescription>per month</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Everything in Free</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">AI-powered deep analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Comprehensive reporting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Policy generation & revision</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 flex items-center gap-2" 
                onClick={() => navigate('/login')}
                icon={<CreditCard className="h-4 w-4" />}
              >
                
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Ensure GDPR Compliance?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of organizations using PoliverAI to maintain privacy compliance
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/signup')} className="justify-center mx-auto w-fit" icon={<BarChart className="h-5 w-5" />} iconColor="text-black">
            Start Your Free Analysis Today
          </Button>
        </div>
      </div>
      )}

      {/* Team carousel */}
      <TeamCarousel />
      {/* Decorative divider between write-up and carousel */}

      <div className="flex justify-center">
        <div className="w-36 h-1 rounded-full bg-gradient-to-r from-blue-400 to-green-400 my-6" />
      </div>

      {/* Team write-up */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Why We Love Building Poliver AI</h3>
          <p className="text-lg text-gray-600">
            Our team takes great pride in building PoliverAI. We collaborate openly, learn from
            each other, and bring curiosity to solve privacy challenges that matter. Every
            feature is crafted with care — to make compliance easier, more reliable, and
            human-centered. Working together on this project isn't just a job for us — it's a
            shared passion, and we hope that energy comes through for our users.
          </p>
        </div>
      </div>

      {/* Footer specifically for the landing page: match CTA section's background */}
      <Footer hasBackground={true} />
    </div>
  )
}
