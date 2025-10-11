import { Link } from 'react-router-dom'
import useNavLinks from '@/hooks/useNavLinks'
import { t } from '@/i18n'

type Props = {
  isPro: boolean
  reportsCount?: number | null
}

export default function NavLinks({ isPro, reportsCount }: Props) {
  const links = useNavLinks(isPro, reportsCount)
  return (
    <>
      {links.filter(l => l.show).map((l) => (
        <Link key={l.to} to={l.to} className="text-sm font-medium hover:text-blue-600 transition-colors">
          {t(l.key)}
        </Link>
      ))}
    </>
  )
}
