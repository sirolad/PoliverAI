import { t } from '@/i18n'
import { formatFileMeta } from '@/lib/policyHelpers'

export default function useSelectedFileInfo(file: File | null) {
  if (!file) {
    return {
      label: t('policy_analysis.selected_file'),
      meta: t('policy_analysis.no_file_selected'),
    }
  }
  return {
    label: t('policy_analysis.selected_file'),
    meta: formatFileMeta(file),
  }
}
