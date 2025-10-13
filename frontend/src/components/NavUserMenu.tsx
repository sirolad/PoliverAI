import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { User, LogOut, CreditCard, ChevronRight, Clock, BarChart2, Grid, List, Menu, Plus } from 'lucide-react'
import { t } from '@/i18n'
import NavUserInfo from './NavUserInfo'
import { twFromTokens, textSizes, colors, baseFontSizes, fontWeights, hoverBgFromColor } from '@/styles/styleTokens'

type Props = {
  isMobile: boolean
  isPro: boolean
  user?: { name?: string } | null
  reportsCount?: number | null
  menuOpen: boolean
  setMenuOpen: (v: boolean | ((s: boolean) => boolean)) => void
  menuRef: React.RefObject<HTMLDivElement | null>
  menuButtonRef: React.RefObject<HTMLButtonElement | null>
  setCreditsModalOpen: (v: boolean) => void
  handleLogout: () => void
  showResult: (status: string | boolean, title: string, message?: string) => void
}

export default function NavUserMenu({ isMobile, isPro, user, reportsCount, menuOpen, setMenuOpen, menuRef, menuButtonRef, setCreditsModalOpen, handleLogout, showResult }: Props) {
  return (
    <>
      <div className="hidden md:flex items-center gap-4">{/* spacer for desktop */}</div>
      <NavUserInfo showBadge />

      {!isMobile && (
        <div className="flex items-center gap-4">
          <NavUserInfo showName />

          {!isPro && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" icon={<Plus className="h-4 w-4" />} collapseToIcon onClick={async () => {
              try {
                await (await import('@/services/payments')).default.purchaseUpgrade(29)
              } catch (err: unknown) {
                console.error(err)
                const msg = err instanceof Error ? err.message : String(err)
                showResult(false, t('payments.failed'), msg)
              }
            }}>
              {t('navbar.upgrade_to_pro')}
            </Button>
          )}

          <Button size="sm" variant="outline" icon={<CreditCard className="h-4 w-4" />} collapseToIcon onClick={() => setCreditsModalOpen(true)}>
            {t('navbar.buy_credits')}
          </Button>

          <Button size="sm" variant="ghost" icon={<LogOut className="h-4 w-4" />} collapseToIcon onClick={handleLogout} className="flex items-center gap-1">
            {t('navbar.logout')}
          </Button>
        </div>
      )}

      {isMobile && (
          <div className="relative">
            <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen((s) => !s)}
            className={twFromTokens('p-2 rounded-md border shadow-sm focus:outline-none flex items-center', colors.mutedBorder, colors.surface)}
            aria-label={t('navbar.open_user_menu')}
          >
            <Menu className={twFromTokens('h-5 w-5', colors.textSecondary)} />
          </button>

          {menuOpen && (
            <div ref={menuRef} className="absolute right-0 mt-2 w-56 bg-white rounded shadow py-1 z-[9999]">
              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-700" />
                    <div>
                      <div className={twFromTokens(textSizes.sm, fontWeights.medium)}>{user?.name}</div>
                      <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{isPro ? t('navbar.badge_pro') : t('navbar.badge_free')}</div>
                    </div>
                  </div>
                </div>
              </div>
              <Link to="/dashboard" className={twFromTokens(textSizes.sm, 'flex items-center gap-2 px-4 py-2', hoverBgFromColor(colors.surfaceMuted))}>
                <Grid className={twFromTokens('h-4 w-4', colors.textMuted)} />
                <span>{t('navbar.dashboard')}</span>
              </Link>
              <Link to="/analyze" className={twFromTokens(textSizes.sm, 'flex items-center gap-2 px-4 py-2', hoverBgFromColor(colors.surfaceMuted))}>
                <BarChart2 className={twFromTokens('h-4 w-4', colors.textMuted)} />
                <span>{t('navbar.analyze_policy')}</span>
              </Link>
              {(isPro || (typeof reportsCount === 'number' && reportsCount > 0)) && (
                <Link to="/reports" className={twFromTokens(textSizes.sm, 'flex items-center gap-2 px-4 py-2 hover:bg-gray-50')}>
                  <List className={twFromTokens('h-4 w-4', colors.textMuted)} />
                  <span>{t('navbar.reports')}</span>
                </Link>
              )}
              <Link to="/credits" className={twFromTokens(textSizes.sm, 'flex items-center gap-2 px-4 py-2', hoverBgFromColor(colors.surfaceMuted))}>
                <Clock className={twFromTokens('h-4 w-4', colors.textMuted)} />
                <span>{t('navbar.transaction_history')}</span>
              </Link>
              {!isPro && (
                <Button variant="ghost" className={twFromTokens(textSizes.sm, 'w-full text-left px-4 py-2 flex items-center gap-2', hoverBgFromColor(colors.surfaceMuted))} itIsInNavBar onClick={async () => { setMenuOpen(false); try { await (await import('@/services/payments')).default.purchaseUpgrade(29) } catch (err) { console.error(err); const msg = err instanceof Error ? err.message : String(err); showResult(false, t('payments.failed'), msg) } }} icon={<ChevronRight className={twFromTokens('h-4 w-4', colors.textMuted)} />}>
                    <span>{t('navbar.upgrade_to_pro')}</span>
                  </Button>
              )}
              <hr className="my-1 border-t" />
              <Button variant="ghost" itIsInNavBar className={twFromTokens(textSizes.sm, 'w-full text-left px-4 py-2 flex items-center gap-2', hoverBgFromColor(colors.surfaceMuted))} onClick={() => { setMenuOpen(false); setCreditsModalOpen(true) }} icon={<CreditCard className={twFromTokens('h-4 w-4', colors.textMuted) + ' flex-shrink-0'} />}>
                <span>{t('navbar.buy_credits')}</span>
              </Button>
              <hr className="my-1 border-t" />
              <Button variant="ghost" itIsInNavBar className={twFromTokens(textSizes.sm, 'w-full text-left px-4 py-2 flex items-center gap-2', hoverBgFromColor(colors.surfaceMuted))} onClick={() => { setMenuOpen(false); handleLogout() }} icon={<LogOut className={twFromTokens('h-4 w-4', colors.textMuted) + ' flex-shrink-0'} />}>
                <span>{t('navbar.logout')}</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
