import * as React from 'react'
import { Button } from './Button'
import IconButton from './IconButton'
import { getInputClassName } from '@/lib/ui/inputHelpers'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { X, Save } from 'lucide-react'
import { t } from '@/i18n'
import Text from '@/components/ui/Text'
import { twFromTokens, baseFontSizes, fontWeights, colors } from '@/styles/styleTokens'

type Props = {
  open: boolean
  initial?: string
  onClose: () => void
  onConfirm: (title: string, saveType?: 'regular' | 'html') => Promise<void>
}

export default function EnterTitleModal({ open, initial = '', onClose, onConfirm }: Props) {
  const [title, setTitle] = React.useState<string>(initial)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [saveType, setSaveType] = React.useState<'regular' | 'html'>('regular')

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={getModalBackdropClass()} onClick={onClose}></div>
      <div className={getModalContainerClass()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={twFromTokens('p-2 rounded-full', colors.successBg, colors.success)}>
              <Save className={twFromTokens('h-5 w-5', colors.onPrimary)} />
            </div>
            <div>
              <div className={twFromTokens(baseFontSizes.lg, fontWeights.semibold)}>{t('enter_title_modal.title')}</div>
              <Text preset="small" color="textMuted">{t('enter_title_modal.subtitle')}</Text>
            </div>
          </div>
          <IconButton onClick={onClose} aria-label={t('enter_title_modal.close_aria')}><X /></IconButton>
        </div>
        <div className="p-4">
          <Text preset="small" color="textMuted" className="mb-4">{t('enter_title_modal.description')}</Text>
          <div className="flex items-center gap-2">
            <input
              className={getInputClassName('border rounded px-3 py-2 w-full')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              placeholder={t('enter_title_modal.placeholder')}
            />
          </div>
          <div className="flex items-center gap-2 mt-4 justify-end">
            <select value={saveType} onChange={(e) => setSaveType(e.target.value as 'regular' | 'html')} className="border rounded px-2 py-2 mr-2">
              <option value="html">{t('enter_title_modal.option_html')}</option>
              <option value="regular">{t('enter_title_modal.option_regular')}</option>
            </select>
            <Button onClick={handleConfirm} disabled={isProcessing || !title.trim()} icon={<Save className={twFromTokens('h-4 w-4', colors.onPrimary)} />} iconColor="text-white">
              {isProcessing ? t('enter_title_modal.saving') : t('enter_title_modal.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
