export function safeDebug(label: string, obj?: unknown) {
  try {
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug(label, obj)
    }
  } catch {
    // swallow
  }
}
