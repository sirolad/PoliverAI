import policyService from '@/services/policyService'
import { X, DownloadCloud, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { safeDispatch } from '@/lib/eventHelpers'
import { extractErrorStatus } from '@/lib/errorHelpers'
import EnterTitleModal from './EnterTitleModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import InsufficientCreditsModal from './InsufficientCreditsModal'
import MetaLine from './MetaLine'

type Props = {
  reportUrl: string
  filename?: string | null
  title?: string
  onClose: () => void
  onSaved?: (filename: string) => void
  onDeleted?: (filename: string) => void
  isQuick?: boolean
  onInsufficient?: () => void
  icon?: React.ReactNode
}

export default function ReportViewerModal({ reportUrl, filename, title, onClose, onSaved, onDeleted, isQuick, onInsufficient, icon }: Props) {
  const [titleModalOpen, setTitleModalOpen] = useState(false)
  const [pendingTitle, setPendingTitle] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [insufficientOpen, setInsufficientOpen] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/50">
      <div className="w-full max-w-5xl bg-white rounded shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="flex items-center gap-3 min-w-0">
            {typeof icon !== 'undefined' ? <div className="text-gray-700 flex-shrink-0">{icon}</div> : null}
            <div className="min-w-0">
              <div className="font-semibold truncate max-w-full">{title || filename || 'Report'}</div>
              <MetaLine>Preview the generated report. You can save, download or delete it.</MetaLine>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<DownloadCloud className="h-4 w-4" />} collapseToIcon onClick={async () => {
                if (!filename) return
                try {
                  await policyService.downloadReport(filename)
                } catch (e) {
                  console.warn('modal download failed', e)
                }
              }}>Download</Button>
            <Button variant="default" size="sm" icon={<Save className="h-4 w-4" />} collapseToIcon onClick={() => {
                // open title modal to collect document title before saving
                setPendingTitle(title || filename || '')
                setTitleModalOpen(true)
              }}>Save</Button>
            <Button variant="destructive" size="sm" icon={<Trash2 className="h-4 w-4" />} collapseToIcon onClick={() => {
                setConfirmDeleteOpen(true)
              }}>Delete</Button>
            <Button variant="ghost" size="sm" icon={<X className="h-4 w-4" />} collapseToIcon onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="h-[80vh]">
          <iframe src={reportUrl} className="w-full h-full" title={filename || 'report-viewer'} />
        </div>
        <EnterTitleModal
          open={titleModalOpen}
          initial={pendingTitle ?? ''}
          onClose={() => setTitleModalOpen(false)}
          onConfirm={async (docTitle: string) => {
            if (!filename) return
            try {
              const resp = await policyService.saveReport(filename, docTitle, { is_quick: !!isQuick })
              if (onSaved) onSaved(resp.filename)
            } catch (err) {
              console.warn('save with title failed', err)
              const status = extractErrorStatus(err)
              if (status === 402) {
                setInsufficientOpen(true)
                if (typeof onInsufficient === 'function') onInsufficient()
              } else {
                console.warn('save with title unexpected error', err)
              }
            }
          }}
        />
        <ConfirmDeleteModal
          open={confirmDeleteOpen}
          filename={filename}
          icon={<X className="h-5 w-5 text-red-600" />}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={async () => {
            if (!filename) return
            try {
              await policyService.deleteReport(filename)
              if (onDeleted) onDeleted(filename)
              // Emit a global event so other UI (Dashboard) can track deletions
              try {
                safeDispatch('reports:deleted', { filenames: [filename] })
              } catch (e) {
                console.warn('Failed to dispatch reports:deleted event', e)
              }
              setConfirmDeleteOpen(false)
            } catch (e) {
              console.warn('delete failed', e)
            }
            
          }}
        />
        <InsufficientCreditsModal open={insufficientOpen} onClose={() => setInsufficientOpen(false)} />
      </div>
    </div>
  )
}
