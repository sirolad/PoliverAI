import { useEffect, useRef, useState } from 'react'

type Targets = Record<string, number>

type Options = {
  // Total duration (ms) that the ramp should take (distributed across steps)
  durationMs?: number
  // Maximum number of discrete steps to use (small number makes the ramp perceptible)
  maxSteps?: number
  // Minimum interval between steps (ms)
  minIntervalMs?: number
}

/**
 * Animate numeric counters from 0 up to target values in a configurable number of steps.
 * - targets: object with numeric values
 * - enabled: when true, start ramping; when false, keep zeros
 * - options: { durationMs, maxSteps, minIntervalMs }
 * Returns current animated values (same keys as targets).
 */
export default function useRampedCounters<T extends Targets>(targets: T, enabled: boolean, options: Options = {}) {
  const { durationMs = 1200, maxSteps = 5, minIntervalMs = 30 } = options

  const [values, setValues] = useState<T>(() => {
    const initObj: Record<string, number> = {}
    Object.keys(targets || {}).forEach((k) => { initObj[k] = 0 })
    return initObj as T
  })

  const timers = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!enabled) return

    const snapshotTargets = { ...targets }

    Object.keys(snapshotTargets).forEach((key) => {
      const target = Number(snapshotTargets[key] || 0)
      // start from 0 so the effect feels like a ramp-up when the widget appears
      const current = 0
      if (target <= current) {
        setValues((s) => ({ ...s, [key]: target }))
        return
      }

      const diff = target - current

      // Decide how many steps to use: no more than maxSteps, but never less than 1
      const steps = Math.max(1, Math.min(maxSteps, diff))
      const stepSize = Math.max(1, Math.ceil(diff / steps))
      const intervalMs = Math.max(minIntervalMs, Math.round(durationMs / steps))
      let next = current

      const t = window.setInterval(() => {
        next = Math.min(target, next + stepSize)
        setValues((s) => ({ ...s, [key]: next }))
        if (next >= target) {
          const ti = timers.current[key]
          if (ti) window.clearInterval(ti)
          delete timers.current[key]
        }
      }, intervalMs)

      timers.current[key] = t
    })

    const timersSnapshot = { ...timers.current }
    return () => {
      Object.keys(timersSnapshot).forEach((k) => {
        const t = timersSnapshot[k]
        if (t) window.clearInterval(t)
      })
    }
    // only trigger when enabled or targets change semantically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(targets), durationMs, maxSteps, minIntervalMs])

  return values as T
}
