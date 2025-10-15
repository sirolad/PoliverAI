import Splash from '@/components/ui/Splash'

type Props = {
  show: boolean
  onFinish?: () => void
  delayMs?: number
  durationMs?: number
}

export default function ConditionalSplash({ show, onFinish, delayMs, durationMs }: Props) {
  if (!show) return null
  return <Splash onFinish={onFinish} delayMs={delayMs} durationMs={durationMs} />
}
