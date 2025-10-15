import { t } from '@/i18n'

export default function useAnalysisProgress(message: string | null | undefined, progress: number | null | undefined) {
  const displayMessage = message || t('policy_analysis.analyzing')
  const percent = Math.min(100, Math.max(0, Number(progress ?? 0)))
  return { displayMessage, percent }
}
