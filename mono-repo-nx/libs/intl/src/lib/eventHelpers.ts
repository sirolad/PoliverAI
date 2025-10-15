// React Native safeDispatch stub
export function safeDispatch(name: string, detail?: unknown) {
  // In React Native, use context or event emitter
  // This is a stub for integration
  // Example: Use a global event emitter or context
  // console.log(`Dispatching event: ${name}`, detail);
}

export function safeDispatchMultiple(events: Array<{ name: string; detail?: unknown }>) {
  for (const ev of events) {
    safeDispatch(ev.name, ev.detail);
  }
}
