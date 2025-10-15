import { useTranslation, useAuth } from '@poliverai/intl'
import { useMemo } from 'react'

type Feature = {
  icon?: unknown
  title: string
  description?: string
  available: boolean
  key?: string
}

export default function useAvailableFeatures(hasCredits: boolean) {
  const { t } = useTranslation()
  const auth = useAuth() as unknown as { isPro?: boolean }
  const isPro = !!auth?.isPro

  const freeFeatures: Feature[] = useMemo(() => [
    {
      title: t('dashboard.features.free.policy_verification.title'),
      description: t('dashboard.features.free.policy_verification.desc'),
      available: true,
    },
    {
      title: t('dashboard.features.free.fast_analysis.title'),
      description: t('dashboard.features.free.fast_analysis.desc'),
      available: true,
    },
    {
      title: t('dashboard.features.free.basic_recommendations.title'),
      description: t('dashboard.features.free.basic_recommendations.desc'),
      available: true,
    },
  ], [t])

  const proFeatures: Feature[] = useMemo(() => [
    {
      title: t('dashboard.features.pro.ai_analysis.title'),
      description: t('dashboard.features.pro.ai_analysis.desc'),
      // Available if user is PRO or has credits
      available: isPro || hasCredits,
      key: 'analysis',
    },
    {
      title: t('dashboard.features.pro.reports.title'),
      description: t('dashboard.features.pro.reports.desc'),
      available: isPro || hasCredits,
      key: 'report',
    },
    {
      title: t('dashboard.features.pro.policy_generation.title'),
      description: t('dashboard.features.pro.policy_generation.desc'),
      available: isPro || hasCredits,
      key: 'ingest',
    },
  ], [t, isPro, hasCredits])

  return { freeFeatures, proFeatures, isPro }
}
