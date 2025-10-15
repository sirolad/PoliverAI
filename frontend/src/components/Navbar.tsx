<<<<<<< HEAD
import React from 'react'
import { useNavigate } from 'react-router-dom'
import NavBrand from './NavBrand'
import useAuth from '@/contexts/useAuth'
import { t } from '@/i18n'
import NavAuthActions from './NavAuthActions'
import NavUserMenu from './NavUserMenu'
import NavLinks from './NavLinks'
import { store } from '@/store/store'
import { setPendingCheckout } from '@/store/paymentsSlice'
import PaymentsService from '@/services/payments'
import { CreditCard } from 'lucide-react'
import { twFromTokens, colors, spacing, alignment } from '@/styles/styleTokens'
import { buildPendingCheckoutFromResponse } from '@/lib/paymentsHelpers'
import { useState } from 'react'
import usePaymentResult from '@/hooks/usePaymentResult'
import useIsMobile from '@/hooks/useIsMobile'
import useOutsideClick from '@/hooks/useOutsideClick'
import PaymentResultModal from './ui/PaymentResultModal'
import EnterCreditsModal from './ui/EnterCreditsModal'

export function Navbar() {
  const { user, logout, isAuthenticated, isPro, refreshUser, reportsCount } = useAuth()
=======
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, User, LogOut } from 'lucide-react'

export function Navbar() {
  const { user, logout, isAuthenticated, isPro } = useAuth()
>>>>>>> main
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

<<<<<<< HEAD
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(true)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState<string | undefined>()
  const [creditsModalOpen, setCreditsModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null)

  const showResult = (status: string | boolean, title: string, message?: string) => {
    const success = typeof status === 'boolean' ? status : String(status).toLowerCase() === 'success'
    setModalSuccess(success)
    setModalTitle(title)
    setModalMessage(message)
    setModalOpen(true)
  }
  const isMobile = useIsMobile(1140)

  // Listen for global payment events and persisted results
  usePaymentResult(showResult, refreshUser)

  // Close menu when clicking outside
  useOutsideClick(menuRef, menuOpen, () => setMenuOpen(false), menuButtonRef)

  // Nav user info (badge/credits) handled by NavUserInfo component


  // Note: payment result, isMobile and outside-click are handled by hooks above

  return (
    <>
      <PaymentResultModal open={modalOpen} success={modalSuccess} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
      <EnterCreditsModal
        open={creditsModalOpen}
        icon={<CreditCard className={twFromTokens('h-5 w-5', colors.textSecondary)} />}
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
            showResult(false, t('payments.failed'), msg)
          }
        }}
      />
      <nav className={twFromTokens(spacing.navbarBg)}>
        <div className={twFromTokens(spacing.navbarContainer, alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
          {/* Logo */}
          <NavBrand />

          {/* Navigation Links */}
          {/* Desktop links: hidden when collapsed mobile menu is active */}
          <div className={twFromTokens(isMobile ? 'hidden' : 'hidden md:flex', alignment.itemsCenter, 'gap-6')}>
            {isAuthenticated && (
              <>
                <NavLinks isPro={isPro} reportsCount={reportsCount} />
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4 relative">
            {isAuthenticated ? (
              <NavUserMenu
                isMobile={isMobile}
                isPro={isPro}
                user={user}
                reportsCount={reportsCount}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                menuRef={menuRef}
                menuButtonRef={menuButtonRef}
                setCreditsModalOpen={setCreditsModalOpen}
                handleLogout={handleLogout}
                showResult={showResult}
              />
            ) : (
              <div>
                <NavAuthActions />
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
=======
  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Shield className="h-6 w-6 text-blue-600" />
          <span>PoliverAI</span>
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
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Upgrade to Pro
                </Button>
              )}

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
>>>>>>> main
  )
}
