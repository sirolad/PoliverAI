import { Button } from '@/components/ui/Button'
import { t } from '@/i18n'
import { RefreshCw, Trash2 } from 'lucide-react'
import { twFromTokens, colors, spacing, alignment } from '@/styles/styleTokens'

type BulkActionsProps = {
  deleting: boolean
  onRefresh: () => void
  onDeleteOpen: () => void
}

export default function BulkActions({ deleting, onRefresh, onDeleteOpen }: BulkActionsProps) {
  return (
    <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
      <Button variant="outline" size="sm" onClick={onRefresh} icon={<RefreshCw className={twFromTokens(spacing.iconsXs, colors.textMuted)} />} title={t('reports_bulk_actions.refresh_title')} collapseToIcon>
        {t('reports_bulk_actions.refresh')}
      </Button>
      <Button variant="destructive" size="sm" disabled={deleting} onClick={onDeleteOpen} icon={<Trash2 className={twFromTokens(spacing.iconsXs, colors.onPrimary)} />} iconColor="text-white" title={t('reports_bulk_actions.delete_title')} collapseToIcon>
        {t('reports_bulk_actions.delete_selected')}
      </Button>
    </div>
  )
}
