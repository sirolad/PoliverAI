import React from 'react'
import { t } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { FileCheck } from 'lucide-react'
import { twFromTokens, colors, baseFontSizes, fontWeights, spacing, alignment, buttons } from '@/styles/styleTokens'

type Props = {
  onGenerate: () => void | Promise<void>
  disabled?: boolean
  className?: string
  /** optional aria-label for the CTA button to improve accessibility */
  buttonAriaLabel?: string
}

function FullReportPrompt({ onGenerate, disabled = false, className = '', buttonAriaLabel }: Props) {
  return (
    <div className={twFromTokens('h-full w-full', alignment.center, className)} role="region" aria-labelledby="full-report-prompt-title">
      <div className={twFromTokens('text-center', spacing.modalPadding)}>
        <div className={twFromTokens('mx-auto', alignment.center, 'rounded-full', spacing.emptyOuterMd, colors.surfaceMuted)}>
          <FileCheck className={twFromTokens(spacing.emptyIconLg, colors.textMuted)} />
        </div>
        <div id="full-report-prompt-title" className={twFromTokens(spacing.smallTop, fontWeights.semibold, baseFontSizes.lg)}>{t('policy_analysis.full_report_not_generated_title')}</div>
        <div className={twFromTokens(spacing.tinyTop, baseFontSizes.sm, colors.textMutedLight)}>{t('policy_analysis.full_report_not_generated_desc')}</div>
        <div className={twFromTokens(spacing.sectionButtonTop)}>
          <Button
            onClick={onGenerate}
            disabled={disabled}
            className={twFromTokens(buttons.base, colors.primaryBg, colors.ctaText)}
            icon={<FileCheck className={twFromTokens(spacing.iconsXs)} />}
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
