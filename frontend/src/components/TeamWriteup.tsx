import useTeam from '@/hooks/useTeam'
import Heading from './ui/Heading'
import Text from './ui/Text'
import { twFromTokens, spacing, alignment, colors } from '@/styles/styleTokens'

export default function TeamWriteup() {
  const { heading, paragraph } = useTeam()

  return (
    <>
      <div className={twFromTokens(alignment.center)}>
        <div className={twFromTokens(spacing.dividerShort, colors.gradientBlueGreen.tw)} />
      </div>

      {/* Team write-up */}
      <div className={twFromTokens(spacing.sectionContainer)}>
        <div className={twFromTokens(alignment.centerColumn, 'max-w-3xl', 'mx-auto')}>
          <Heading as="h3" preset="subheading" className={twFromTokens(spacing.headingMargin)} color="textPrimary">{heading}</Heading>
          <Text preset="lead" color="textMuted">{paragraph}</Text>
        </div>
      </div>
    </>
  )
}
