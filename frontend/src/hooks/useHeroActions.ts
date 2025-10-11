import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useHeroActions() {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)

  const onStartFree = useCallback(() => {
    navigate('/signup')
  }, [navigate])

  const onUpgrade = useCallback(() => {
    // placeholder: navigate to login/upgrade flow
    navigate('/login')
  }, [navigate])

  const onGoDashboard = useCallback(() => {
    navigate('/dashboard')
  }, [navigate])

  return { isProcessing, setIsProcessing, onStartFree, onUpgrade, onGoDashboard }
}
