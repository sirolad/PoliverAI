import { useEffect } from 'react'

// Accept a nullable element ref and an optional button ref. The generics are
// intentionally loose so callers can pass in HTMLDivElement, HTMLButtonElement, etc.
export default function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  onOutside: () => void,
  buttonRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (!enabled) return
      const outsideMain = ref?.current ? !ref.current.contains(target) : true
      const outsideButton = buttonRef?.current ? !buttonRef.current.contains(target) : true
      if (outsideMain && outsideButton) onOutside()
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [ref, enabled, onOutside, buttonRef])
}
