import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { LogIn, UserPlus } from 'lucide-react'
import { t } from '@/i18n'

export default function NavAuthActions() {
  return (
    <div className="flex items-center gap-2">
      <Link to="/login">
        <Button variant="ghost" size="sm" className="flex items-center gap-2 whitespace-nowrap flex-shrink-0" icon={<LogIn className="h-4 w-4" />}>
          {t('navbar.login')}
        </Button>
      </Link>
      <Link to="/register">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap flex-shrink-0" icon={<UserPlus className="h-4 w-4" />}>
          {t('navbar.sign_up')}
        </Button>
      </Link>
    </div>
  )
}
