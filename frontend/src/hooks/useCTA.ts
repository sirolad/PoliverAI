import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useCTA() {
  const navigate = useNavigate()

  const onStartFree = useCallback(() => {
    navigate('/signup')
  }, [navigate])

  return { onStartFree }
}
