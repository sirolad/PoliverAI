import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { LogIn, UserPlus } from 'lucide-react'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, spacing, alignment } from '@/styles/styleTokens'

export default function NavAuthActions() {
  return (
    <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
      <Link to="/login">
        <Button variant="ghost" size="sm" className={twFromTokens(textSizes.sm, alignment.flexRow, alignment.itemsCenter, alignment.gap2, 'whitespace-nowrap flex-shrink-0')} icon={<LogIn className={twFromTokens('h-4 w-4')} />}>
          {t('navbar.login')}
        </Button>
      </Link>
      <Link to="/register">
        <Button size="sm" className={twFromTokens(spacing.buttonSmall, textSizes.sm, alignment.flexRow, alignment.itemsCenter, alignment.gap2, 'whitespace-nowrap flex-shrink-0', colors.primaryBg, colors.ctaText)} icon={<UserPlus className={twFromTokens('h-4 w-4')} />}>
          {t('navbar.sign_up')}
        </Button>
      </Link>
    </div>
  )
}
