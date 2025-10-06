import policyService from '@/services/policyService'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { safeDispatch } from '@/lib/eventHelpers'
import { extractErrorStatus } from '@/lib/errorHelpers'
import EnterTitleModal from './EnterTitleModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import InsufficientCreditsModal from './InsufficientCreditsModal'

type Props = {
  reportUrl: string
  filename?: string | null
  title?: string
  onClose: () => void
  onSaved?: (filename: string) => void
  onDeleted?: (filename: string) => void
  isQuick?: boolean
  onInsufficient?: () => void
}

export default function ReportViewerModal({ reportUrl, filename, title, onClose, onSaved, onDeleted, isQuick, onInsufficient }: Props) {
  const [titleModalOpen, setTitleModalOpen] = useState(false)
  const [pendingTitle, setPendingTitle] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [insufficientOpen, setInsufficientOpen] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/50">
      <div className="w-full max-w-5xl bg-white rounded shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="font-semibold">{title || filename || 'Report'}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={async () => {
                if (!filename) return
                try {
                  await policyService.downloadReport(filename)
                } catch (e) {
                  console.warn('modal download failed', e)
                }
              }}>Download</Button>
            <Button variant="default" size="sm" onClick={() => {
                // open title modal to collect document title before saving
                setPendingTitle(title || filename || '')
                setTitleModalOpen(true)
              }}>Save</Button>
            <Button variant="destructive" size="sm" onClick={() => {
                setConfirmDeleteOpen(true)
              }}>Delete</Button>
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
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
