import { t } from '@/i18n'

type Props = {
  downloadUrl: string | null
  filename?: string | null
}

export default function RevisedPolicyPreview({ downloadUrl, filename }: Props) {
  if (downloadUrl) {
    return (
      <div className="h-full w-full min-h-0">
        <div className="mb-2 text-sm text-gray-600">{t('policy_analysis.revised_policy_preview')}</div>
        <div className="h-[70vh]">
          <iframe
            title={filename ?? 'revised-policy'}
            src={downloadUrl as string}
            className="w-full h-full border rounded"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center p-6">
        <div className="mx-auto w-40 h-40 flex items-center justify-center rounded-full bg-gray-100">
          <svg className="h-20 w-20 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <div className="mt-4 text-xl font-semibold">{t('policy_analysis.nothing_here_generate')}</div>
        <div className="mt-2 text-sm text-gray-500">{t('policy_analysis.nothing_here_desc')}</div>
      </div>
    </div>
  )
}
