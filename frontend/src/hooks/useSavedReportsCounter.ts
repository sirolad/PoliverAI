import { useEffect, useState } from 'react'

export default function useSavedReportsCounter(target: number, enabled: boolean) {
  const [value, setValue] = useState<number>(enabled ? target : 0)

  useEffect(() => {
    if (!enabled) {
      setValue(0)
      return
    }
    // simple ramp: step towards target in small intervals
    const duration = 900
    const steps = Math.min(6, Math.max(1, Math.round(target / 10)))
    const interval = Math.max(40, Math.floor(duration / steps))
    let current = 0
    const delta = Math.max(1, Math.floor(target / steps))
    const t = setInterval(() => {
      current += delta
      if (current >= target) {
        setValue(target)
        clearInterval(t)
      } else {
        setValue(current)
      }
    }, interval)
    return () => clearInterval(t)
  }, [target, enabled])

  return value
}
