import policyService from '@/services/policyService'
import { useState } from 'react'
import EnterTitleModal from './EnterTitleModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'

type Props = {
  reportUrl: string
  filename?: string | null
  title?: string
  onClose: () => void
  onSaved?: (filename: string) => void
  onDeleted?: (filename: string) => void
  isQuick?: boolean
}

export default function ReportViewerModal({ reportUrl, filename, title, onClose, onSaved, onDeleted, isQuick }: Props) {
  const [titleModalOpen, setTitleModalOpen] = useState(false)
  const [pendingTitle, setPendingTitle] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/50">
      <div className="w-full max-w-5xl bg-white rounded shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="font-semibold">{title || filename || 'Report'}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!filename) return
                try {
                  await policyService.downloadReport(filename)
                } catch (e) {
                  console.warn('modal download failed', e)
                }
              }}
              className="px-3 py-1 bg-gray-100 rounded"
            >
              Download
            </button>
            <button
              onClick={() => {
                // open title modal to collect document title before saving
                setPendingTitle(title || filename || '')
                setTitleModalOpen(true)
              }}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => {
                setConfirmDeleteOpen(true)
              }}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Delete
            </button>
            <button onClick={onClose} className="px-3 py-1 bg-white border rounded">Close</button>
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
              setConfirmDeleteOpen(false)
            } catch (e) {
              console.warn('delete failed', e)
            }
          }}
        />
      </div>
    </div>
  )
}
