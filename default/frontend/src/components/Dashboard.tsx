import { Navigate, useNavigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  FileCheck,
  BarChart,
  Clock,
  Shield,
  Zap,
  Upload,
  Star,
  Lock
} from 'lucide-react'
import PaymentsService from '@/services/payments'

export function Dashboard() {
  const { user, isAuthenticated, isPro, loading } = useAuth()
  const hasCredits = (user?.credits ?? 0) > 0
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const freeFeatures = [
    {
      icon: FileCheck,
      title: 'Policy Verification',
      description: 'Upload and analyze privacy policies with basic GDPR compliance checks',
      available: true,
    },
    {
      icon: Clock,
      title: 'Fast Analysis',
      description: 'Quick rule-based compliance screening',
      available: true,
    },
    {
      icon: Shield,
      title: 'Basic Recommendations',
      description: 'Get essential compliance improvement suggestions',
      available: true,
    },
  ]

  const proFeatures = [
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI analysis with nuanced violation detection',
      // Available if user is PRO or has credits
      available: isPro || hasCredits,
    },
    {
      icon: BarChart,
      title: 'Comprehensive Reports',
      description: 'Detailed PDF reports with confidence scores and evidence',
      available: isPro || hasCredits,
    },
    {
      icon: FileCheck,
      title: 'Policy Generation',
      description: 'Automatically generate revised compliant policies',
      available: isPro || hasCredits,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your GDPR compliance analysis and reports from your dashboard.
          </p>
        </div>

        {/* Account Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className={`h-5 w-5 ${isPro ? 'text-blue-600' : 'text-green-600'}`} />
                  Account Status
                </CardTitle>
                <CardDescription>
                  You are currently on the {isPro ? 'Pro' : 'Free'} plan
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isPro
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {isPro ? 'PRO PLAN' : 'FREE PLAN'}
                </span>
                {!isPro && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                      try {
                        await PaymentsService.purchaseUpgrade(29)
                        window.dispatchEvent(new CustomEvent('payment:result', { detail: { success: true, title: 'Upgrade Successful', message: 'Your account is now PRO' } }))
                        window.location.reload()
                      } catch (err: unknown) {
                        console.error(err)
                        const msg = err instanceof Error ? err.message : String(err)
                        window.dispatchEvent(new CustomEvent('payment:result', { detail: { success: false, title: 'Payment Failed', message: msg } }))
                      }
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          {!isPro && (
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Unlock Premium Features</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Get AI-powered deep analysis, comprehensive reporting, and policy generation
                  with our Pro plan starting at $29/month.
                </p>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    try {
                      await PaymentsService.purchaseUpgrade(29)
                      window.dispatchEvent(new CustomEvent('payment:result', { detail: { success: true, title: 'Upgrade Successful', message: 'Your account is now PRO' } }))
                      window.location.reload()
                    } catch (err: unknown) {
                      console.error(err)
                      const msg = err instanceof Error ? err.message : String(err)
                      window.dispatchEvent(new CustomEvent('payment:result', { detail: { success: false, title: 'Payment Failed', message: msg } }))
                    }
                  }}
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/analyze')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Analyze New Policy</CardTitle>
                    <CardDescription>
                      Upload a privacy policy for GDPR compliance analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {isPro && (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/reports')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">View Reports</CardTitle>
                      <CardDescription>
                        Access your detailed compliance reports and history
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>

        {/* Available Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Features</h2>

          {/* Free Features */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Free Tier Features
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {freeFeatures.map((feature, index) => (
                <Card key={index} className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <feature.icon className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pro Features */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Pro Plan Features
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {proFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className={`h-full ${
                    !feature.available ? 'opacity-60 bg-gray-50' : 'border-blue-200'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <feature.icon
                        className={`h-5 w-5 ${
                          feature.available ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      />
                      <CardTitle className="text-base flex items-center gap-2">
                        {feature.title}
                        {!feature.available && <Lock className="h-4 w-4 text-gray-400" />}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                    {!feature.available && (
                      <div className="mt-2">
                        <Button size="sm" variant="outline" disabled>
                          Upgrade Required
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              New to PoliverAI? Here's how to get the most out of your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Upload Your First Policy</h4>
                  <p className="text-sm text-gray-600">
                    Start by uploading a privacy policy document to analyze for GDPR compliance
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Review Analysis Results</h4>
                  <p className="text-sm text-gray-600">
                    Examine compliance scores, violations, and recommendations for improvement
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium">
                    {isPro ? 'Generate Reports' : 'Consider Upgrading'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isPro
                      ? 'Create detailed compliance reports and generate revised policies'
                      : 'Upgrade to Pro for advanced AI analysis and comprehensive reporting'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
