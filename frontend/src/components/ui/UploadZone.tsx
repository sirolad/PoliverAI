import useUploadZone from '@/hooks/useUploadZone'
import { UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n'
import { twFromTokens, textSizes, fontWeights, colors, baseFontSizes } from '@/styles/styleTokens'

type Props = {
  file: File | null
  setFile: (f: File | null) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function UploadZone({ file, setFile, fileInputRef, handleFileChange }: Props) {
  const { onDragOver, onDrop, onClick } = useUploadZone({ setFile, fileInputRef })

  return (
    <div className="mb-4">
  <label className={twFromTokens('block', baseFontSizes.sm, fontWeights.medium, 'mb-2')}>{t('policy_analysis.upload_label')}</label>

      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
        className={twFromTokens('mt-2 h-48 w-full rounded-lg border-2 border-dashed', 'bg-gradient-to-b from-white/50 to-blue-50 flex flex-col items-center justify-center text-center px-4 cursor-pointer hover:shadow-md transition-shadow', 'border-blue-200')}
      >
        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.html,.htm,.txt" />
        <UploadCloud className={twFromTokens('h-10 w-10 mb-3', colors.primary)} />
        <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary)}>{t('policy_analysis.upload_hint')}</div>
        <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight, 'mt-1')}>{t('policy_analysis.upload_supports')}</div>
        <div className="mt-3 flex items-center gap-3">
          <Button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            className={twFromTokens('px-3 py-1 rounded-md shadow-sm', 'border', 'border-blue-200', 'hover:bg-blue-50')}
            icon={<UploadCloud className={twFromTokens('h-4 w-4')} />}
            iconColor={twFromTokens(colors.primary)}
            collapseToIcon
          >
            {t('policy_analysis.browse_files')}
          </Button>
          {file ? (
            <Button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className={twFromTokens('px-3 py-1 rounded-md', 'bg-red-600', colors.ctaText)}
              icon={<X className={twFromTokens('h-4 w-4')} />}
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
