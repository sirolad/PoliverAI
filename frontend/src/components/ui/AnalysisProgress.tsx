import { Progress } from '@/components/ui/progress'
import useAnalysisProgress from '@/hooks/useAnalysisProgress'

type Props = {
  message?: string | null
  progress?: number | null
  className?: string
}

export default function AnalysisProgress({ message, progress, className = '' }: Props) {
  const { displayMessage, percent } = useAnalysisProgress(message, progress)

  return (
    <div className={`mb-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-700">{displayMessage}</div>
        <div className="text-sm text-gray-500">{percent}%</div>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  )
}
