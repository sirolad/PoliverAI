import * as React from 'react'
import { Button } from './Button'
import IconButton from './IconButton'
import { getInputClassName } from '@/lib/ui/inputHelpers'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { X, Save } from 'lucide-react'
import { t } from '@/i18n'
import Text from '@/components/ui/Text'
import { twFromTokens, baseFontSizes, fontWeights, colors, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  open: boolean
  initial?: string
  onClose: () => void
  onConfirm: (title: string, saveType?: 'regular' | 'html') => Promise<void>
}

export default function EnterTitleModal({ open, initial = '', onClose, onConfirm }: Props) {
  const [title, setTitle] = React.useState<string>(initial)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [saveType, setSaveType] = React.useState<'regular' | 'html'>('html')

  React.useEffect(() => {
    setTitle(initial)
  }, [initial])

  if (!open) return null

  const handleConfirm = async () => {
    const v = (title || '').trim()
    if (!v) return
    setIsProcessing(true)
    try {
      await onConfirm(v, saveType)
      onClose()
    } catch {
      // let caller handle errors
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={twFromTokens('fixed inset-0 z-50', spacing.fullScreenCenter)}>
      <div className={getModalBackdropClass()} onClick={onClose}></div>
      <div className={getModalContainerClass()}>
        <div className={twFromTokens(spacing.modalPadding, 'border-b', alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, 'gap-3')}>
            <div className={twFromTokens(spacing.iconWrapperCompact, 'rounded-full', colors.greenBg, colors.success)}>
              <Save className={twFromTokens(spacing.iconsMd, colors.onPrimary)} />
            </div>
            <div>
              <div className={twFromTokens(baseFontSizes.lg, fontWeights.semibold)}>{t('enter_title_modal.title')}</div>
              <Text preset="small" color="textMuted">{t('enter_title_modal.subtitle')}</Text>
            </div>
          </div>
          <IconButton onClick={onClose} aria-label={t('enter_title_modal.close_aria')}><X /></IconButton>
        </div>
        <div className={twFromTokens(spacing.modalPadding)}>
          <Text preset="small" color="textMuted" className={twFromTokens(spacing.smallTop)}>{t('enter_title_modal.description')}</Text>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2, spacing.mt3)}>
            <input
              className={getInputClassName(twFromTokens(spacing.input))}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              placeholder={t('enter_title_modal.placeholder')}
            />
          </div>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2, spacing.sectionButtonTop, alignment.justifyEnd)}>
            <select value={saveType} onChange={(e) => setSaveType(e.target.value as 'regular' | 'html')} className={twFromTokens(spacing.input, 'mr-2')}>
              <option value="html">{t('enter_title_modal.option_html')}</option>
              <option value="regular">{t('enter_title_modal.option_regular')}</option>
            </select>
            <Button onClick={handleConfirm} disabled={isProcessing || !title.trim()} icon={<Save className={twFromTokens(spacing.iconsXs, colors.onPrimary)} />} iconColor="text-white">
              {isProcessing ? t('enter_title_modal.saving') : t('enter_title_modal.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
