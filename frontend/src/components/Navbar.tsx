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
import { buildPendingCheckoutFromResponse } from '@/lib/paymentsHelpers'
import { useState } from 'react'
import usePaymentResult from '@/hooks/usePaymentResult'
import useIsMobile from '@/hooks/useIsMobile'
import useOutsideClick from '@/hooks/useOutsideClick'
import PaymentResultModal from './ui/PaymentResultModal'
import EnterCreditsModal from './ui/EnterCreditsModal'

export function Navbar() {
  const { user, logout, isAuthenticated, isPro, refreshUser, reportsCount } = useAuth()
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
            showResult(false, t('payments.failed'), msg)
          }
        }}
      />
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavBrand />

          {/* Navigation Links */}
          {/* Desktop links: hidden when collapsed mobile menu is active */}
          <div className={`${isMobile ? 'hidden' : 'hidden md:flex'} items-center gap-6`}>
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
  )
}
