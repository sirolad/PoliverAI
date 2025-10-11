import policyService from '@/services/policyService'
import { X, DownloadCloud, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { safeDispatch } from '@/lib/eventHelpers'
import { extractErrorStatus } from '@/lib/errorHelpers'
import EnterTitleModal from './EnterTitleModal'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import InsufficientCreditsModal from './InsufficientCreditsModal'
import MetaLine from './MetaLine'
import { renderMarkdownToHtml } from '@/lib/policyAnalysisHelpers'
import NoDataView from '@/components/ui/NoDataView'

// Helper: walk a node and inline computed styles onto elements so the
// exported HTML preserves appearance when rendered by a PDF engine.
function inlineComputedStyles(root: HTMLElement): string {
  // Clone node so we don't mutate the live DOM
  const clone = root.cloneNode(true) as HTMLElement

  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT, null)
  const nodes: Element[] = []
  let cur = walker.nextNode()
  while (cur) {
    nodes.push(cur as Element)
    cur = walker.nextNode()
  }

  nodes.forEach((el) => {
    try {
      const comp: CSSStyleDeclaration = window.getComputedStyle(el)
      // Build style string from computed styles; include common properties
      const props = [
        'display','position','width','height','margin','padding','border','boxSizing',
        'fontSize','fontFamily','fontWeight','lineHeight','color','backgroundColor',
        'textAlign','verticalAlign','listStyleType','whiteSpace','overflow','wordBreak'
      ]
      const stylePairs: string[] = []
      props.forEach((p) => {
        const cssName = p.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())
        const v = (comp as unknown as Record<string, string | null>)[p] || comp.getPropertyValue(cssName)
        if (v) stylePairs.push(`${cssName}:${v}`)
      })
      if (stylePairs.length) {
        el.setAttribute('style', stylePairs.join(';'))
      }
    } catch {
      // ignore computed style errors
    }
  })

  // Wrap with minimal HTML skeleton and return
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${clone.outerHTML}</body></html>`
}

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
              <div className="font-semibold truncate max-w-full">{title || filename || t('report_viewer.title_report')}</div>
              <MetaLine>{t('report_viewer.meta_line')}</MetaLine>
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
              }}>{t('report_viewer.download')}</Button>
            {showSave ? (
              <Button variant="default" size="sm" icon={<Save className="h-4 w-4" />} collapseToIcon onClick={() => {
                // open title modal to collect document title before saving
                setPendingTitle(title || filename || '')
                setTitleModalOpen(true)
              }}>{t('report_viewer.save')}</Button>
            ) : null}
            <Button variant="destructive" size="sm" icon={<Trash2 className="h-4 w-4" />} collapseToIcon onClick={() => {
                setConfirmDeleteOpen(true)
              }}>{t('report_viewer.delete')}</Button>
            <Button variant="ghost" size="sm" icon={<X className="h-4 w-4" />} collapseToIcon onClick={onClose}>{t('report_viewer.close')}</Button>
          </div>
        </div>
        <div className="h-[80vh]">
          {savingInline ? (
            <LoadingSpinner message={t('report_viewer.saving_report')} size="lg" />
          ) : loadingDetail ? (
            <LoadingSpinner message={t('report_viewer.loading_preview')} size="lg" />
          ) : detailedContent ? (
            <div className="p-6 overflow-auto h-full prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(detailedContent) }} />
          ) : displayUrl ? (
            <iframe src={displayUrl} className="w-full h-full" title={filename || t('report_viewer.iframe_title')} />
          ) : (
            <div className="p-6 h-full">
              <NoDataView title={t('report_viewer.preview_not_available_title')} message={t('report_viewer.preview_not_available_message')} iconType="report" iconSize="md" />
            </div>
          )}
        </div>
        <EnterTitleModal
          open={titleModalOpen}
          initial={pendingTitle ?? ''}
          onClose={() => setTitleModalOpen(false)}
          onConfirm={async (docTitle: string, saveType?: 'regular' | 'html') => {
            try {
              if (filename) {
                const resp = await policyService.saveReport(filename, docTitle, { is_quick: !!isQuick })
                if (onSaved) onSaved(resp.filename)
              } else {
                // No filename: save inline content. Use the provided title to
                // build a friendly filename (slug) and persist as markdown so it
                // can be rendered inline in the viewer.
                // const safeName = `${slugify(docTitle) || 'report'}-${Date.now()}.${saveType === 'html' ? 'pdf' : 'md'}`
                const safeName = `${slugify(docTitle) || 'report'}-${Date.now()}.pdf`
                const contentToSave = detailedContent ?? `# ${docTitle}\n\n(Preview not available)`
                setSavingInline(true)
                try {
                  if (saveType === 'html' && typeof inlineContent === 'string' && inlineContent.startsWith('data:image')) {
                    const base64 = inlineContent.split(',')[1]
                    const resp = await policyService.saveReportInline('', safeName, docTitle, { is_quick: !!isQuick, save_type: 'html', image_base64: base64 })
                    if (onSaved) onSaved(resp.filename)
                  } else {
                      if (saveType === 'html') {
                        // Try to capture the preview DOM (the prose container) and
                        // inline computed styles so the resulting HTML preserves
                        // the current look for PDF rendering.
                        let htmlToSave = contentToSave
                        try {
                          const previewEl = document.querySelector('.prose') as HTMLElement | null
                          if (previewEl) {
                            htmlToSave = inlineComputedStyles(previewEl)
                          } else {
                            // Fallback: render the markdown to HTML string
                            htmlToSave = renderMarkdownToHtml(detailedContent ?? contentToSave)
                          }
                        } catch (e) {
                          console.warn('Failed to capture styled HTML preview, falling back to raw content', e)
                          htmlToSave = renderMarkdownToHtml(detailedContent ?? contentToSave)
                        }
                        // The API expects 'html' for HTML content saves
                        const resp = await policyService.saveReportInline(htmlToSave, safeName, docTitle, { is_quick: !!isQuick, save_type: 'html' })
                        if (onSaved) onSaved(resp.filename)
                      } else {
                        const resp = await policyService.saveReportInline(contentToSave, safeName, docTitle, { is_quick: !!isQuick, save_type: saveType || 'regular' })
                        if (onSaved) onSaved(resp.filename)
                      }
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
