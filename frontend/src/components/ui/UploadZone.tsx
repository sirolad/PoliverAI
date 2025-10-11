import useUploadZone from '@/hooks/useUploadZone'
import { UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n'

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
      <label className="block text-sm font-medium mb-2">{t('policy_analysis.upload_label')}</label>

      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
        className="mt-2 h-48 w-full rounded-lg border-2 border-dashed border-blue-200 bg-gradient-to-b from-white/50 to-blue-50 flex flex-col items-center justify-center text-center px-4 cursor-pointer hover:shadow-md transition-shadow"
      >
        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.html,.htm,.txt" />
        <UploadCloud className="h-10 w-10 text-blue-500 mb-3" />
        <div className="text-sm font-medium text-gray-700">{t('policy_analysis.upload_hint')}</div>
        <div className="text-xs text-gray-500 mt-1">{t('policy_analysis.upload_supports')}</div>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }} className="border border-blue-200 text-blue-700 px-3 py-1 rounded-md shadow-sm hover:bg-blue-50" icon={<UploadCloud className="h-4 w-4" />} iconColor="text-white" collapseToIcon>{t('policy_analysis.browse_files')}</Button>
          {file ? (
            <Button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }} className="px-3 py-1 bg-red-600 text-white rounded-md" icon={<X className="h-4 w-4" />} iconColor="text-white" collapseToIcon>{t('policy_analysis.remove')}</Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
