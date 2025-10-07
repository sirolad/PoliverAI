import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import useAuth from '@/contexts/useAuth'
import useRampedCounters from '@/hooks/useRampedCounters'
import { User, LogOut, CreditCard, ChevronRight, LogIn, UserPlus, Clock, BarChart2, Grid, List, Menu } from 'lucide-react'
import PaymentsService from '@/services/payments'
import { buildPendingCheckoutFromResponse, getCreditsTotal, normalizePaymentResult } from '@/lib/paymentsHelpers'
import { useState } from 'react'
import PaymentResultModal from './ui/PaymentResultModal'
import { store } from '@/store/store'
import { setPendingCheckout, clearPaymentResult } from '@/store/paymentsSlice'
import EnterCreditsModal from './ui/EnterCreditsModal'

export function Navbar() {
  const { user, logout, isAuthenticated, isPro, refreshUser, loading } = useAuth()
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
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null)

  // Ramped credits for navbar: compute targets and call hook at top-level
  const navCreditsTotal = getCreditsTotal(user)
  const navRampEnabled = !!user && !loading
  const animatedNavCredits = useRampedCounters({ total: navCreditsTotal }, navRampEnabled, { durationMs: 1400, maxSteps: 6, minIntervalMs: 80 })

  const showResult = (status: string | boolean, title: string, message?: string) => {
    const success = typeof status === 'boolean' ? status : String(status).toLowerCase() === 'success'
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
      if (detail) {
          // refresh current user to pick up potential tier changes
          (async () => { try { await refreshUser() } catch (err) { console.warn('refreshUser failed', err) } })()
          showResult(detail.status || (detail.success ? 'success' : 'failed'), detail.title, detail.message)
      }
    }

    const checkPersisted = () => {
      try {
        const state = store.getState()
        const pr = state?.payments?.paymentResult
          if (pr) {
          (async () => { try { await refreshUser() } catch (err) { console.warn('refreshUser failed', err) } })()
          const normalized = normalizePaymentResult(pr)
          showResult(normalized.status || 'failed', normalized.title, normalized.message)
          // clear via store so it doesn't show repeatedly
          try { store.dispatch(clearPaymentResult()) } catch { /* noop */ }
        }
      } catch (err) {
        console.warn('Failed to read persisted payment_result from store', err)
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
  }, [location, refreshUser])

  // Track viewport width to enable collapsed menu at <=1140px
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1140)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Close menu when clicking outside
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuOpen) {
        if (menuRef.current && !menuRef.current.contains(target) && menuButtonRef.current && !menuButtonRef.current.contains(target)) {
          setMenuOpen(false)
        }
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [menuOpen])

  return (
    <>
      <PaymentResultModal open={modalOpen} success={modalSuccess} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
      <EnterCreditsModal
        open={creditsModalOpen}
        icon={<CreditCard className="h-5 w-5 text-gray-700" />}
        onClose={() => setCreditsModalOpen(false)}
        onConfirm={async (amount_usd: number) => {
          try {
            const res = await PaymentsService.purchaseCredits(amount_usd)
            // Persist the API response (session id) so the app can call the
            // transaction status check endpoint when the user returns from
            // Stripe. PaymentsService already attempts to cache pending checkout
            // before redirect, but persist the actual response here to be sure.
              try {
                const pending = buildPendingCheckoutFromResponse(res, amount_usd)
                try {
                  store.dispatch(setPendingCheckout(pending))
                  console.log('persisted pending checkout after purchaseCredits', pending, res)
                } catch (e) {
                  console.warn('Failed to persist pending checkout to store', e)
                }
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
  {/* Desktop links: hidden when collapsed mobile menu is active */}
  <div className={`${isMobile ? 'hidden' : 'hidden md:flex'} items-center gap-6`}>
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
                Transaction History
              </Link>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4 relative">
          {isAuthenticated ? (
            <>
              {/* Always show PRO/FREE badge and credits on navbar (even when collapsed) */}
              <div className="hidden md:flex items-center gap-4">
                {/* Desktop credits and badge are handled in the full block below */}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${isPro ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{isPro ? 'PRO' : 'FREE'}</span>
                {/* Hide credits until user data is loaded; then show and animate */}
                {navRampEnabled ? (
                  <div title={`Total: ${navCreditsTotal} credits`} className="text-sm px-2 py-1 rounded bg-gray-100">
                    Credits: {animatedNavCredits.total}
                  </div>
                ) : null}
              </div>

              {/* Desktop: show full actions (name + buttons) */}
              {!isMobile && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{user?.name}</span>
                    </div>
                  </div>

                  {/* Upgrade button for free users */}
                  {!isPro && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" icon={<ChevronRight className="h-4 w-4" />} collapseToIcon onClick={async () => {
                      try {
                        await PaymentsService.purchaseUpgrade(29)
                      } catch (err: unknown) {
                        console.error(err)
                        const msg = err instanceof Error ? err.message : String(err)
                        showResult(false, 'Payment Failed', msg)
                      }
                    }}>
                      Upgrade to Pro
                    </Button>
                  )}

                  {/* Buy Credits button */}
                  <Button size="sm" variant="outline" icon={<CreditCard className="h-4 w-4" />} collapseToIcon onClick={() => setCreditsModalOpen(true)}>
                    Buy Credits
                  </Button>

                  {/* Logout */}
                  <Button size="sm" variant="ghost" icon={<LogOut className="h-4 w-4" />} collapseToIcon onClick={handleLogout} className="flex items-center gap-1">
                    Logout
                  </Button>
                </div>
              )}

              {/* Mobile: collapsed menu toggle (use user icon as button) */}
              {isMobile && (
                <div className="relative">
                  <button
                    ref={menuButtonRef}
                    onClick={() => setMenuOpen((s) => !s)}
                    className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 shadow-sm focus:outline-none flex items-center"
                    aria-label="Open user menu"
                  >
                    <Menu className="h-5 w-5 text-gray-700" />
                  </button>

                  {menuOpen && (
                    <div ref={menuRef} className="absolute right-0 mt-2 w-56 bg-white rounded shadow py-1 z-50">
                      <div className="px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-gray-700" />
                            <div>
                              <div className="text-sm font-medium">{user?.name}</div>
                              <div className="text-xs text-gray-500">{isPro ? 'PRO' : 'FREE'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <Grid className="h-4 w-4 text-gray-600" />
                        <span>Dashboard</span>
                      </Link>
                      <Link to="/analyze" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <BarChart2 className="h-4 w-4 text-gray-600" />
                        <span>Analyze Policy</span>
                      </Link>
                      {isPro && (
                        <Link to="/reports" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                          <List className="h-4 w-4 text-gray-600" />
                          <span>Reports</span>
                        </Link>
                      )}
                      <Link to="/credits" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span>Transaction History</span>
                      </Link>
                      {!isPro && (
                        <Button variant="ghost" className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={async () => { setMenuOpen(false); try { await PaymentsService.purchaseUpgrade(29) } catch (err) { console.error(err); const msg = err instanceof Error ? err.message : String(err); showResult(false, 'Payment Failed', msg) } }}>
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                          <span>Upgrade to Pro</span>
                        </Button>
                      )}
                      <Button variant="ghost" className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => { setMenuOpen(false); setCreditsModalOpen(true) }}>
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span>Buy Credits</span>
                      </Button>
                      <hr className="my-1 border-t border-gray-100" />
                      <Button variant="ghost" className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => { setMenuOpen(false); handleLogout() }}>
                        <LogOut className="h-4 w-4 text-gray-600" />
                        <span>Logout</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 whitespace-nowrap flex-shrink-0" icon={<LogIn className="h-4 w-4" />}>
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap flex-shrink-0" icon={<UserPlus className="h-4 w-4" />}>
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
