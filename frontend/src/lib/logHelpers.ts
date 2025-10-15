export function safeDebug(label: string, obj?: unknown) {
  try {
    // guard in case console is not available or stringify fails
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug(label, obj)
    }
  } catch {
    // swallow
  }
}
