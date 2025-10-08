import policyService from '@/services/policyService'
import { X, DownloadCloud, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { safeDispatch } from '@/lib/eventHelpers'
import { extractErrorStatus } from '@/lib/errorHelpers'
import EnterTitleModal from './EnterTitleModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import InsufficientCreditsModal from './InsufficientCreditsModal'
import MetaLine from './MetaLine'
import { renderMarkdownToHtml } from '@/lib/policyAnalysisHelpers'

type Props = {
  reportUrl: string
  filename?: string | null
  title?: string
  // Optional inline content (markdown/plain text) to render directly
  inlineContent?: string | null
  onClose: () => void
  onSaved?: (filename: string) => void
  onDeleted?: (filename: string) => void
  isQuick?: boolean
  onInsufficient?: () => void
  icon?: React.ReactNode
  showSave?: boolean
}

export default function ReportViewerModal({ reportUrl, filename, title, inlineContent, onClose, onSaved, onDeleted, isQuick, onInsufficient, icon, showSave = true }: Props) {
  const [titleModalOpen, setTitleModalOpen] = useState(false)
  const [pendingTitle, setPendingTitle] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [insufficientOpen, setInsufficientOpen] = useState(false)
  const [detailedContent, setDetailedContent] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [savingInline, setSavingInline] = useState(false)
  // Normalize report URL so we don't render gs:// links directly in an iframe
  const getDisplayUrl = () => {
    try {
      if (!reportUrl) return reportUrl
      if (reportUrl.startsWith('gs://')) {
        // fallback to app download endpoint which will stream the file
        const parts = reportUrl.split('/')
        const filenameFromGs = parts.length ? parts[parts.length - 1] : filename
        return `/api/v1/reports/download/${encodeURIComponent(filenameFromGs || String(reportUrl))}`
      }
      return reportUrl
    } catch {
      return reportUrl
    }
  }
  const displayUrl = getDisplayUrl()
  // Use inlineContent if provided; otherwise try to fetch detailed report content when filename is present
  useEffect(() => {
    let mounted = true
    const fetchDetail = async () => {
      if (inlineContent) {
        setDetailedContent(inlineContent)
        return
      }
      if (!filename) {
        setDetailedContent(null)
        return
      }
      setLoadingDetail(true)
      try {
        const resp = await policyService.getDetailedReport(filename)
        if (!mounted) return
        if (resp && typeof resp.content === 'string' && resp.content.length > 0) {
          setDetailedContent(resp.content)
        } else {
          setDetailedContent(null)
        }
      } catch (e) {
        // If fetching detailed report fails, just fallback to iframe/download
        console.debug('failed to fetch detailed report', e)
        if (mounted) setDetailedContent(null)
      } finally {
        if (mounted) setLoadingDetail(false)
      }
    }
    fetchDetail()
    return () => { mounted = false }
  }, [filename, inlineContent])

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
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
            {showSave ? (
              <Button variant="default" size="sm" icon={<Save className="h-4 w-4" />} collapseToIcon onClick={() => {
                // open title modal to collect document title before saving
                setPendingTitle(title || filename || '')
                setTitleModalOpen(true)
              }}>Save</Button>
            ) : null}
            <Button variant="destructive" size="sm" icon={<Trash2 className="h-4 w-4" />} collapseToIcon onClick={() => {
                setConfirmDeleteOpen(true)
              }}>Delete</Button>
            <Button variant="ghost" size="sm" icon={<X className="h-4 w-4" />} collapseToIcon onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="h-[80vh]">
          {savingInline ? (
            <LoadingSpinner message="Saving report…" size="lg" />
          ) : loadingDetail ? (
            <LoadingSpinner message="Loading preview…" size="lg" />
          ) : detailedContent ? (
            <div className="p-6 overflow-auto h-full prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(detailedContent) }} />
          ) : displayUrl ? (
            <iframe src={displayUrl} className="w-full h-full" title={filename || 'report-viewer'} />
          ) : (
            <div className="p-6">
              <div className="text-sm text-gray-700">Preview not available. You can download the report using the Download button.</div>
            </div>
          )}
        </div>
        <EnterTitleModal
          open={titleModalOpen}
          initial={pendingTitle ?? ''}
          onClose={() => setTitleModalOpen(false)}
          onConfirm={async (docTitle: string, saveType?: 'markdown' | 'prettify') => {
            try {
              if (filename) {
                const resp = await policyService.saveReport(filename, docTitle, { is_quick: !!isQuick })
                if (onSaved) onSaved(resp.filename)
              } else {
                // No filename: save inline content. Use the provided title to
                // build a friendly filename (slug) and persist as markdown so it
                // can be rendered inline in the viewer.
                const safeName = `${slugify(docTitle) || 'report'}-${Date.now()}.${saveType === 'prettify' ? 'pdf' : 'md'}`
                const contentToSave = detailedContent ?? `# ${docTitle}\n\n(Preview not available)`
                setSavingInline(true)
                try {
                  if (saveType === 'prettify' && typeof inlineContent === 'string' && inlineContent.startsWith('data:image')) {
                    const base64 = inlineContent.split(',')[1]
                    const resp = await policyService.saveReportInline('', safeName, docTitle, { is_quick: !!isQuick, save_type: 'prettify', image_base64: base64 })
                    if (onSaved) onSaved(resp.filename)
                  } else {
                    const resp = await policyService.saveReportInline(contentToSave, safeName, docTitle, { is_quick: !!isQuick, save_type: saveType || 'markdown' })
                    if (onSaved) onSaved(resp.filename)
                  }
                } finally {
                  setSavingInline(false)
                }
              }
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
