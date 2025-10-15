export function stopPropagation(e: unknown) {
  // web-specific events won't exist in RN; noop for now
  return
}

// Safe dispatchers to keep parity with web event dispatching.
export function safeDispatch(eventName: string, payload?: unknown) {
  try {
    // In RN, apps can use DeviceEventEmitter or another emitter; here we simply
    // log for now and keep a placeholder for future wiring.
    console.debug('[safeDispatch]', eventName, payload)
  } catch (_e) {
    void _e
  }
}

export function safeDispatchMultiple(events: Array<{ name: string; payload?: unknown }>) {
  for (const ev of events) {
    safeDispatch(ev.name, ev.payload)
  }
}
