import useHowItWorks from '@/hooks/useHowItWorks'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, spacing, alignment, fontWeights } from '@/styles/styleTokens'

export default function HowItWorks() {
  const { steps } = useHowItWorks()

  return (
    <div className={twFromTokens(colors.pageBg, spacing.sectionPaddingY)}>
      <div className={twFromTokens(spacing.sectionContainer)}>
        <div className={twFromTokens('text-center', spacing.headingMargin)}>
          <h2 className={twFromTokens(fontWeights.bold, 'mb-4', textSizes.h2, colors.textPrimary)}>{t('how.title')}</h2>
          <p className={twFromTokens(textSizes.lead, colors.textMuted)}>{t('how.subtitle')}</p>
        </div>

        <div className={twFromTokens('max-w-4xl mx-auto grid md:grid-cols-3 gap-8')}>
          {steps.map((s) => (
            <div key={s.id} className={twFromTokens(alignment.centerColumn)}>
              <div className={twFromTokens('bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold')}>{s.id}</div>
              <h3 className={twFromTokens(textSizes.lg, fontWeights.semibold, 'mb-2')}>{s.title}</h3>
              <p className={twFromTokens(textSizes.md, colors.textMuted)}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
