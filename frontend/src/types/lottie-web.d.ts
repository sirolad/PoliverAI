declare module 'lottie-web' {
  type AnimationItem = {
    destroy: () => void
  }
  export function loadAnimation(opts: { container: Element | null; renderer?: string; loop?: boolean | number; autoplay?: boolean; path?: string }): AnimationItem
  const _default: { loadAnimation: typeof loadAnimation }
  export default _default
}
