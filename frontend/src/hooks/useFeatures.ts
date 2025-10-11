import { getFreeFeatures, getProFeatures } from '@/lib/landingHelpers'

export default function useFeatures() {
  const freeFeatures = getFreeFeatures()
  const proFeatures = getProFeatures()

  return { freeFeatures, proFeatures }
}
