import React from 'react'
import { t } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { FileCheck } from 'lucide-react'

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
        <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100">
          <FileCheck className="h-10 w-10 text-gray-500" />
        </div>
        <div id="full-report-prompt-title" className="mt-4 text-xl font-semibold">{t('policy_analysis.full_report_not_generated_title')}</div>
        <div className="mt-2 text-sm text-gray-500">{t('policy_analysis.full_report_not_generated_desc')}</div>
        <div className="mt-4">
          <Button
            onClick={onGenerate}
            disabled={disabled}
            className="px-4 py-2 bg-black text-white rounded"
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
