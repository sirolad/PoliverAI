export function safeDispatch(name: string, detail?: unknown) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      if (typeof detail !== 'undefined') {
        window.dispatchEvent(new CustomEvent(name, { detail }))
      } else {
        window.dispatchEvent(new Event(name))
      }
    }
  } catch (err) {
    // Keep debug-level logging; non-fatal in client
    console.debug(`safeDispatch: failed to dispatch ${name}`, err)
  }
}

export function safeDispatchMultiple(events: Array<{ name: string; detail?: unknown }>) {
  for (const ev of events) {
    safeDispatch(ev.name, ev.detail)
  }
}
