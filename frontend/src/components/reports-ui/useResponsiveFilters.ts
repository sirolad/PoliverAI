import { useEffect, useState } from 'react'

export default function useResponsiveFilters() {
  const [showFilters, setShowFilters] = useState<boolean>(true)
  const [isMobile1276, setIsMobile1276] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth <= 1276 : false))

  useEffect(() => {
    const onResize = () => {
      const isMobile = window.innerWidth <= 700
      setShowFilters(!isMobile)
      setIsMobile1276(window.innerWidth <= 1276)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return { showFilters, setShowFilters, isMobile1276 }
}
