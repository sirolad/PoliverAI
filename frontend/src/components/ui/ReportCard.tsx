import React from 'react'
import type { ReportMetadata } from '@/types/api'
import { Star, StarHalf, Star as StarEmpty } from 'phosphor-react'
import { DownloadCloud, ExternalLink } from 'lucide-react'
import { Button } from './Button'
import policyService from '@/services/policyService'
import { normalizeStatus, isFullReport, getStarCounts, formatFileSize, formatDateTime } from '@/lib/reportHelpers'

type Props = {
  report: ReportMetadata
  selected?: boolean
  onToggleSelect?: (filename: string) => void
  onOpen: (r: ReportMetadata) => void
  onDownload: (r: ReportMetadata) => void
  onExternalOpen?: (r: ReportMetadata) => void
}

export default function ReportCard({ report: r, selected, onToggleSelect, onOpen, onDownload, onExternalOpen }: Props) {
  const score = typeof r.score === 'number' ? Math.max(0, Math.min(100, r.score)) : undefined
  const hasStars = score != null
  const isFull = isFullReport(r)
  const vnorm = normalizeStatus((r.verdict || r.status) as string)
  const hasVerdict = Boolean(r.verdict)
  const hasExtraContent = hasStars || isFull || hasVerdict || Boolean(r.file_size) || Boolean(r.document_name)
  const cardMinHeightClass = hasExtraContent ? 'card-min-h-mobile-long md:min-h-0' : 'card-min-h-mobile md:min-h-0'

  return (
    <div className={`${cardMinHeightClass} p-4 border rounded grid grid-cols-12 gap-4 items-start md:flex md:items-center ${selected ? 'border-blue-600 bg-blue-50' : ''}`}>
      <div className="col-span-1 flex items-center h-full">
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect && onToggleSelect(r.filename)}
          className="w-4 h-4"
          aria-label={`Select report ${r.filename}`}
        />
      </div>
      <div className="col-span-10 flex-1">
        <div className="font-semibold">{r.title || r.document_name}</div>
        <div className="text-sm text-gray-600">{r.document_name}</div>
        <div className="text-sm text-gray-500 mt-1">{formatDateTime(r.created_at)}</div>
        <div className="text-sm text-gray-500 truncate">filename: <span className="font-mono">{r.filename}</span></div>
        {r.file_size ? (
          <div className="text-sm text-gray-500">Size: {formatFileSize(r.file_size)}</div>
        ) : null}

        <div className="mt-2 ml-2 mr-2 flex items-center gap-2">
          {(() => {
            if (score == null) return null
            const { full, half, empty, percentage } = getStarCounts(score)
            const icons: React.ReactElement[] = []
            for (let i = 0; i < full; i++) icons.push(<Star key={`f-${i}`} size={16} weight="fill" className="text-yellow-500" />)
            if (half) icons.push(<StarHalf key={`h`} size={16} weight="fill" className="text-yellow-500" />)
            for (let i = 0; i < empty; i++) icons.push(<StarEmpty key={`e-${i}`} size={16} weight="duotone" className="text-gray-300" />)
            return (
              <div className="flex items-center text-sm text-gray-700">
                <div className="flex items-center gap-0.5">{icons}</div>
                <div className="ml-2 text-xs text-gray-500">{percentage}%</div>
              </div>
            )
          })()}
        </div>

        {(() => {
          if (!isFull && !hasVerdict) return null
          return (
            <div className="inline-flex items-center mt-2 text-xs font-medium rounded overflow-hidden">
              {isFull ? (
                <div className="px-2 py-1 bg-green-100 text-green-700 border border-r-0 border-green-200">Full</div>
              ) : null}
              {hasVerdict ? (
                <div className={`px-2 py-1 border ${vnorm === 'compliant' ? 'bg-green-100 text-green-700 border-green-200' : vnorm === 'partially_compliant' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {String(r.verdict).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>
              ) : null}
            </div>
          )
        })()}
      </div>
      <div className={`col-span-1 flex-shrink-0 ml-0 md:ml-4 flex items-center space-x-2 w-full md:w-auto justify-end self-end`}>
        {r.gcs_url ? (
          <Button onClick={() => (onExternalOpen ? onExternalOpen(r) : policyService.openReport(r))} className="text-sm bg-gray-700 text-white px-3 py-1 rounded" icon={<ExternalLink className="h-4 w-4" />} iconColor="text-white" collapseToIcon>
            Open
          </Button>
        ) : null}
        <Button onClick={() => onOpen(r)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded" icon={<ExternalLink className="h-4 w-4" />} collapseToIcon>
          View
        </Button>
        <Button onClick={() => onDownload(r)} className="bg-green-600 text-white px-3 py-1 rounded" icon={<DownloadCloud className="h-4 w-4" />} iconColor="text-white" collapseToIcon>
          Download
        </Button>
      </div>
    </div>
  )
}
