import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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

  // Listen for global payment result events and also re-check persisted
  // payment results when the window regains focus or when the route changes.
  const location = useLocation()
  React.useEffect(() => {
    const eventHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      console.log('payment:result event received', detail)
      if (detail) showResult(detail.success, detail.title, detail.message)
    }

    const checkPersisted = () => {
      try {
        const raw = localStorage.getItem('poliverai:payment_result')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed) {
            showResult(parsed.success, parsed.title, parsed.message)
            // clear so it doesn't show repeatedly
            console.log('clearing persisted payment result', parsed)
            localStorage.removeItem('poliverai:payment_result')
          }
        }
      } catch (err) {
        // ignore parse errors
        console.warn('Failed to read persisted payment_result', err)
      }
    }

    // Listen for global dispatched events
    window.addEventListener('payment:result', eventHandler as EventListener)
    // Re-check when the window gains focus (user returns to tab)
    window.addEventListener('focus', checkPersisted)

    // Run once on mount and also whenever location changes
    checkPersisted()

    return () => {
      window.removeEventListener('payment:result', eventHandler as EventListener)
      window.removeEventListener('focus', checkPersisted)
    }
  }, [location])

  return (
    <>
      <PaymentResultModal open={modalOpen} success={modalSuccess} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
      <EnterCreditsModal
        open={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        onConfirm={async (amount_usd: number) => {
          try {
            const res = await PaymentsService.purchaseCredits(amount_usd)
            // Persist the API response (session id) so the app can call the
            // transaction status check endpoint when the user returns from
            // Stripe. PaymentsService already attempts to cache pending checkout
            // before redirect, but persist the actual response here to be sure.
            try {
              const r = res as unknown as Record<string, unknown> | null
              const sid = r ? (r['id'] || r['sessionId'] || r['session_id'] || null) : null
              const pending = { session_id: sid, type: 'credits', amount_usd }
              localStorage.setItem('poliverai:pending_checkout', JSON.stringify(pending))
              console.log('persisted pending checkout after purchaseCredits', pending, res)
            } catch (e) {
              // Non-fatal: continue even if localStorage fails
              console.warn('Failed to persist pending checkout after purchaseCredits', e)
            }
            // Do not show success here — the app will finalize the checkout on return
            // and the global payment:result event will trigger the modal.
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
                Purchased Credits
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
                        // Don't show success or reload here — finalization will occur when
                        // the user returns from Stripe and the app will show the result then.
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
