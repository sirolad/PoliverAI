import { useCallback } from 'react'

type SetBool = (v: boolean) => void
type SetTab = (tab: 'free' | 'full' | 'revised') => void

export default function useTabSwitcher(setActiveTab: SetTab, setLoadingDetailed: SetBool, setLoadingRevised: SetBool) {
  const goFree = useCallback(() => {
    setActiveTab('free')
  }, [setActiveTab])

  const goFull = useCallback(() => {
    setActiveTab('full')
    setLoadingDetailed(true)
    // transient visual loading — mirror original behavior
    window.setTimeout(() => {
      setLoadingDetailed(false)
    }, 1200)
  }, [setActiveTab, setLoadingDetailed])

  const goRevised = useCallback(() => {
    setActiveTab('revised')
    setLoadingRevised(true)
    window.setTimeout(() => {
      setLoadingRevised(false)
    }, 1200)
  }, [setActiveTab, setLoadingRevised])

  return { goFree, goFull, goRevised }
}
