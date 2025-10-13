import { Link } from 'react-router-dom'
import useNavLinks from '@/hooks/useNavLinks'
import { t } from '@/i18n'
import { twFromTokens, textSizes, fontWeights, colors, hoverFromColor } from '@/styles/styleTokens'

type Props = {
  isPro: boolean
  reportsCount?: number | null
}

export default function NavLinks({ isPro, reportsCount }: Props) {
  const links = useNavLinks(isPro, reportsCount)
  return (
    <>
      {links.filter(l => l.show).map((l) => (
  <Link key={l.to} to={l.to} className={twFromTokens(textSizes.sm, fontWeights.medium, 'transition-colors', hoverFromColor(colors.primary))}>
          {t(l.key)}
        </Link>
      ))}
    </>
  )
}
