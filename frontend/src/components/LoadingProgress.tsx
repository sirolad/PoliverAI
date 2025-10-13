import type { FC } from 'react'
import { twFromTokens, colors } from '@/styles/styleTokens'

type Props = {
  progress: number
  show: boolean
}

const LoadingProgress: FC<Props> = ({ progress, show }) => {
  if (!show) return null
  return (
    <div className="mt-4">
      <div className="w-full">
        <div className={twFromTokens('h-2 w-full rounded-full overflow-hidden', colors.mutedBorder)}>
          <div
            className={`h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-300 ease-out ${progress < 5 ? 'opacity-90 animate-pulse' : ''}`}
            style={{ width: progress < 5 ? '25%' : `${Math.min(100, Math.max(2, progress))}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, Math.max(0, progress))}
          />
        </div>
      </div>
    </div>
  )
}

export default LoadingProgress
