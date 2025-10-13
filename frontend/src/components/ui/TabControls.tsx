import { Lightbulb, FileCheck, Bot, DownloadCloud } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import useTabSwitcher from '@/hooks/useTabSwitcher'
import useReportDownloader from '@/hooks/useReportDownloader'
import { t } from '@/i18n'
import { twFromTokens, colors, spacing, alignment, hoverBgFromColor } from '@/styles/styleTokens'

type Props = {
  activeTab: 'free' | 'full' | 'revised'
  setActiveTab: (tab: 'free' | 'full' | 'revised') => void
  setLoadingDetailed: (v: boolean) => void
  setLoadingRevised: (v: boolean) => void
  reportFilename: string | null
  detailedContent: string | null
}

export default function TabControls({ activeTab, setActiveTab, setLoadingDetailed, setLoadingRevised, reportFilename, detailedContent }: Props) {
  const { goFree, goFull, goRevised } = useTabSwitcher(setActiveTab, setLoadingDetailed, setLoadingRevised)
  const { download } = useReportDownloader()

  return (
    <div className={twFromTokens('mb-3')}>
      <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter)}>
        <button
          className={twFromTokens(
            spacing.pillBtn,
            activeTab === 'free'
              ? twFromTokens(colors.primaryBg, colors.ctaText, 'border-blue-600', 'rounded-l')
              : twFromTokens(colors.surface, colors.textSecondary, 'border-gray-200', 'rounded-l')
          )}
          onClick={goFree}
        >
          <Lightbulb className={twFromTokens(spacing.iconsXs, 'mr-2', colors.textMuted)} /> {t('policy_analysis.free_tab')}
        </button>
        <button
          className={twFromTokens(
            spacing.pillBtn,
            activeTab === 'full'
              ? twFromTokens(colors.primaryBg, colors.ctaText, 'border-blue-600')
              : twFromTokens(colors.surface, colors.textSecondary, 'border-gray-200')
          )}
          onClick={goFull}
        >
          <FileCheck className={twFromTokens(spacing.iconsXs, 'mr-2', colors.textMuted)} /> {t('policy_analysis.full_tab')}
        </button>
        <button
          className={twFromTokens(
            spacing.pillBtn,
            activeTab === 'revised'
              ? twFromTokens(colors.primaryBg, colors.ctaText, 'border-blue-600', 'rounded-r')
              : twFromTokens(colors.surface, colors.textSecondary, 'border-gray-200', 'rounded-r')
          )}
          onClick={goRevised}
        >
          <Bot className={twFromTokens(spacing.iconsXs, 'mr-2', colors.textMuted)} /> {t('policy_analysis.revised_tab')}
        </button>

        <div className="ml-auto">
          <Button
            disabled={!reportFilename}
            onClick={() => download(reportFilename ?? undefined, detailedContent)}
            className={twFromTokens(spacing.buttonSmall, colors.warningBgStrong, colors.ctaText, 'rounded', hoverBgFromColor(colors.warningBgStrong))}
            icon={<DownloadCloud className={twFromTokens(spacing.iconsXs)} />}
            iconColor="text-white"
            collapseToIcon
          >
            {t('policy_analysis.download_file')}
          </Button>
        </div>
      </div>
    </div>
  )
}
