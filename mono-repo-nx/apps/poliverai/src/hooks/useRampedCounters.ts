import { useEffect, useRef, useState } from 'react'

type Targets = Record<string, number>

type Options = {
  durationMs?: number
  maxSteps?: number
  minIntervalMs?: number
}

export default function useRampedCounters<T extends Targets>(targets: T, enabled: boolean, options: Options = {}) {
  const { durationMs = 1200, maxSteps = 5, minIntervalMs = 30 } = options

  const [values, setValues] = useState<T>(() => {
    const initObj: Record<string, number> = {}
    Object.keys(targets || {}).forEach((k) => { initObj[k] = 0 })
    return initObj as T
  })

  const timers = useRef<Record<string, number>>({})

  const serializedTargets = JSON.stringify(targets)

  useEffect(() => {
    if (!enabled) return

    const snapshotTargets = { ...targets }

    Object.keys(snapshotTargets).forEach((key) => {
      const target = Number(snapshotTargets[key] || 0)
      const current = 0
      if (target <= current) {
        setValues((s) => ({ ...s, [key]: target }))
        return
      }

      const diff = target - current
      const steps = Math.max(1, Math.min(maxSteps, diff))
      const stepSize = Math.max(1, Math.ceil(diff / steps))
      const intervalMs = Math.max(minIntervalMs, Math.round(durationMs / steps))
      let next = current

      const t = setInterval(() => {
        next = Math.min(target, next + stepSize)
        setValues((s) => ({ ...s, [key]: next }))
        if (next >= target) {
          const ti = timers.current[key]
          if (ti) clearInterval(ti)
          delete timers.current[key]
        }
      }, intervalMs)

      timers.current[key] = t as unknown as number
    })

    const timersSnapshot = { ...timers.current }
    return () => {
      Object.keys(timersSnapshot).forEach((k) => {
        const t = timersSnapshot[k]
        if (t) clearInterval(t)
      })
    }
  }, [enabled, serializedTargets, targets, durationMs, maxSteps, minIntervalMs])

  return values as T
}
