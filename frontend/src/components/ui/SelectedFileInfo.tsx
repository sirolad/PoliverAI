import useSelectedFileInfo from '@/hooks/useSelectedFileInfo'

type Props = {
  file: File | null
  className?: string
}

export default function SelectedFileInfo({ file, className = '' }: Props) {
  const { label, meta } = useSelectedFileInfo(file)

  return (
    <div className={`mt-3 text-sm text-gray-700 ${className}`}>
      <div className="font-medium">{label}</div>
      <div className="text-xs text-gray-500">{meta}</div>
    </div>
  )
}
