import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { LogIn, UserPlus } from 'lucide-react'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors } from '@/styles/styleTokens'

export default function NavAuthActions() {
  return (
    <div className="flex items-center gap-2">
      <Link to="/login">
        <Button variant="ghost" size="sm" className={twFromTokens(textSizes.sm, 'flex items-center gap-2 whitespace-nowrap flex-shrink-0')} icon={<LogIn className={twFromTokens('h-4 w-4', textSizes.sm)} />}>
          {t('navbar.login')}
        </Button>
      </Link>
      <Link to="/register">
        <Button size="sm" className={twFromTokens(textSizes.sm, 'flex items-center gap-2 whitespace-nowrap flex-shrink-0', colors.primaryBg)} icon={<UserPlus className={twFromTokens('h-4 w-4', textSizes.sm)} />}>
          {t('navbar.sign_up')}
        </Button>
      </Link>
    </div>
  )
}
