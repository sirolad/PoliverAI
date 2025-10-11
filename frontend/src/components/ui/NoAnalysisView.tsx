import { UploadCloud } from 'lucide-react'
import useNoAnalysisTexts from '@/hooks/useNoAnalysisTexts'

type Props = {
  className?: string
}

export default function NoAnalysisView({ className = '' }: Props) {
  const { title, desc } = useNoAnalysisTexts()

  return (
    <div className={`h-full w-full flex items-center justify-center ${className}`}>
      <div className="text-center p-6">
        <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100">
          <UploadCloud className="h-10 w-10 text-gray-500" />
        </div>
        <div className="mt-4 text-lg font-semibold">{title}</div>
        <div className="mt-2 text-sm text-gray-500">{desc}</div>
      </div>
    </div>
  )
}
