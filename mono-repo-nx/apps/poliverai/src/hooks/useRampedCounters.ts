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
  const latestValues = useRef<Record<string, number>>({})

  const serializedTargets = JSON.stringify(targets)

  useEffect(() => {
    latestValues.current = values as Record<string, number>
  }, [values])

  useEffect(() => {
    Object.values(timers.current).forEach((timerId) => {
      if (timerId) clearInterval(timerId)
    })
    timers.current = {}

    if (!enabled) return undefined

    const snapshotTargets = JSON.parse(serializedTargets) as T

    Object.keys(snapshotTargets).forEach((key) => {
      const target = Number(snapshotTargets[key] || 0)
      const current = Number(latestValues.current[key] || 0)

      if (target === current) {
        return
      }

      const diff = target - current
      const steps = Math.max(1, Math.min(maxSteps, Math.abs(diff)))
      const stepSize = Math.max(1, Math.ceil(Math.abs(diff) / steps))
      const intervalMs = Math.max(minIntervalMs, Math.round(durationMs / steps))
      let next = current

      const t = setInterval(() => {
        next = diff > 0
          ? Math.min(target, next + stepSize)
          : Math.max(target, next - stepSize)

        latestValues.current[key] = next
        setValues((s) => ({ ...s, [key]: next }))

        if (next === target) {
          const ti = timers.current[key]
          if (ti) clearInterval(ti)
          delete timers.current[key]
        }
      }, intervalMs)

      timers.current[key] = t as unknown as number
    })

    return () => {
      Object.keys(timers.current).forEach((k) => {
        const timerId = timers.current[k]
        if (timerId) clearInterval(timerId)
      })
      timers.current = {}
    }
  }, [enabled, serializedTargets, durationMs, maxSteps, minIntervalMs])

  return values as T
}
