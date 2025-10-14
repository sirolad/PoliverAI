import useUploadZone from '@/hooks/useUploadZone'
import { UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n'
import { twFromTokens, textSizes, fontWeights, colors, baseFontSizes, spacing, alignment, hoverBgFromColor } from '@/styles/styleTokens'

type Props = {
  file: File | null
  setFile: (f: File | null) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function UploadZone({ file, setFile, fileInputRef, handleFileChange }: Props) {
  const { onDragOver, onDrop, onClick } = useUploadZone({ setFile, fileInputRef })

  return (
    <div className={twFromTokens(spacing.smallTop)}>
        <label className={twFromTokens('block', baseFontSizes.sm, fontWeights.medium, 'mb-2')}>{t('policy_analysis.upload_label')}</label>

        <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
        className={twFromTokens('mt-2', 'h-48 w-full rounded-lg border-2 border-dashed', colors.pageGradient, alignment.centerColumn, 'text-center px-4 cursor-pointer transition-shadow', hoverBgFromColor(colors.surface))}
        >
        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.html,.htm,.txt" />
        <UploadCloud className={twFromTokens(spacing.iconsMdLarge, spacing.blockSmall, colors.primary)} />
        <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary)}>{t('policy_analysis.upload_hint')}</div>
        <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight, 'mt-1')}>{t('policy_analysis.upload_supports')}</div>
        <div className={twFromTokens(spacing.sectionButtonTop, alignment.flexRow, alignment.itemsCenter, alignment.gap3)}>
            <Button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            className={twFromTokens(spacing.buttonSmall, 'rounded-md shadow-sm', 'border', colors.mutedBorder, hoverBgFromColor(colors.primaryBgLight))}
            icon={<UploadCloud className={twFromTokens(spacing.iconsXs)} />}
            iconColor={twFromTokens(colors.ctaText)}
            collapseToIcon
            >
            {t('policy_analysis.browse_files')}
            </Button>
            {file ? (
            <Button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className={twFromTokens(spacing.buttonSmall, 'rounded-md shadow-sm', colors.deepRedBg, hoverBgFromColor(colors.dangerBg))}
                icon={<X className={twFromTokens(spacing.iconsXs)} />}
                iconColor={twFromTokens(colors.ctaText)}
                collapseToIcon
            >
                {t('policy_analysis.remove')}
            </Button>
            ) : null}
        </div>
        </div>
    </div>
  )
}
