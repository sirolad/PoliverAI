import React from 'react'
import { t } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { FileCheck } from 'lucide-react'
import { twFromTokens, colors, baseFontSizes, fontWeights } from '@/styles/styleTokens'

type Props = {
  onGenerate: () => void | Promise<void>
  disabled?: boolean
  className?: string
  /** optional aria-label for the CTA button to improve accessibility */
  buttonAriaLabel?: string
}

function FullReportPrompt({ onGenerate, disabled = false, className = '', buttonAriaLabel }: Props) {
  return (
    <div className={`h-full w-full flex items-center justify-center ${className}`} role="region" aria-labelledby="full-report-prompt-title">
      <div className="text-center p-6">
        <div className={twFromTokens('mx-auto flex items-center justify-center rounded-full', 'w-24 h-24', colors.surfaceMuted)}>
          <FileCheck className={twFromTokens('h-10 w-10', colors.textMuted)} />
        </div>
        <div id="full-report-prompt-title" className={twFromTokens('mt-4', fontWeights.semibold, baseFontSizes.lg)}>{t('policy_analysis.full_report_not_generated_title')}</div>
        <div className={twFromTokens('mt-2', baseFontSizes.sm, colors.textMutedLight)}>{t('policy_analysis.full_report_not_generated_desc')}</div>
        <div className="mt-4">
          <Button
            onClick={onGenerate}
            disabled={disabled}
            className={twFromTokens('px-4 py-2 rounded', colors.primaryBg, colors.ctaText)}
            icon={<FileCheck className="h-4 w-4" />}
            aria-label={buttonAriaLabel ?? t('policy_analysis.generate_full_report_cta')}
          >
            {t('policy_analysis.generate_full_report_cta')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(FullReportPrompt)
