import { useEffect, useState } from 'react'

export default function useIsMobile(breakpoint = 1140) {
  const [isMobile, setIsMobile] = useState<boolean>(false)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return isMobile
}
