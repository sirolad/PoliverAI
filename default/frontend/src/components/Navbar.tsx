import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import useAuth from '@/contexts/useAuth'
import { User, LogOut } from 'lucide-react'
import PaymentsService from '@/services/payments'
import { useState } from 'react'
import PaymentResultModal from './ui/paymentResultModal'
import EnterCreditsModal from './ui/EnterCreditsModal'

export function Navbar() {
  const { user, logout, isAuthenticated, isPro } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(true)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState<string | undefined>()
  const [creditsModalOpen, setCreditsModalOpen] = useState(false)

  const showResult = (success: boolean, title: string, message?: string) => {
    setModalSuccess(success)
    setModalTitle(title)
    setModalMessage(message)
    setModalOpen(true)
  }

  // Listen for global payment result events so other pages/components can trigger the modal
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) showResult(detail.success, detail.title, detail.message)
    }
    window.addEventListener('payment:result', handler as EventListener)
    return () => window.removeEventListener('payment:result', handler as EventListener)
  }, [])

  return (
    <>
      <PaymentResultModal open={modalOpen} success={modalSuccess} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
      <EnterCreditsModal
        open={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        onConfirm={async (amount_usd: number) => {
          try {
            await PaymentsService.purchaseCredits(amount_usd)
            showResult(true, 'Credits Added', `You purchased $${amount_usd} worth of credits`)
            setCreditsModalOpen(false)
          } catch (err: unknown) {
            console.error(err)
            const msg = err instanceof Error ? err.message : String(err)
            showResult(false, 'Payment failed', msg)
          }
        }}
      />
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <img src="/poliverai-icon-transparent.svg" alt="PoliverAI" className="h-12" />
          <span>Poliver <span className="text-blue-600">AI</span></span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/analyze"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Analyze Policy
              </Link>
              {isPro && (
                <Link
                  to="/reports"
                  className="text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  Reports
                </Link>
              )}
              <Link
                to="/credits"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Credits
              </Link>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {/* User tier badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user?.name}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isPro
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {isPro ? 'PRO' : 'FREE'}
                </span>
              </div>

              {/* Upgrade button for free users */}
              {!isPro && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                      try {
                        await PaymentsService.purchaseUpgrade(29)
                        showResult(true, 'Payment Successful', 'Your account is now PRO')
                        window.location.reload()
                      } catch (err: unknown) {
                        console.error(err)
                        const msg = err instanceof Error ? err.message : String(err)
                        showResult(false, 'Payment Failed', msg)
                      }
                  }}
                >
                  Upgrade to Pro
                </Button>
              )}

              {/* Buy Credits button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreditsModalOpen(true)}
              >
                Buy Credits
              </Button>

              {/* Display credits */}
              <div className="text-sm px-2 py-1 rounded bg-gray-100">Credits: {user?.credits ?? 0}</div>

              {/* Logout button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  )
}
