import useHowItWorks from '@/hooks/useHowItWorks'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors } from '@/styles/styleTokens'

export default function HowItWorks() {
  const { steps } = useHowItWorks()

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className={twFromTokens('font-bold mb-4', textSizes.h2, colors.textPrimary)}>{t('how.title')}</h2>
          <p className={twFromTokens(textSizes.lead, colors.textMuted)}>{t('how.subtitle')}</p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.id} className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                {s.id}
              </div>
              <h3 className={twFromTokens(textSizes.lg, 'font-semibold mb-2')}>{s.title}</h3>
              <p className={twFromTokens(textSizes.md, colors.textMuted)}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
