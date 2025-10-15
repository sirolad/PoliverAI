import { useTranslation, useAuth } from '@poliverai/intl'

export default function useGettingStarted() {
  const { t } = useTranslation()
  const auth = useAuth() as unknown as { isPro?: boolean }
  const isPro = !!auth?.isPro

  const title = t('dashboard.getting_started.title')
  const description = t('dashboard.getting_started.description')

  const steps = [
    {
      id: 1,
      title: t('dashboard.getting_started.steps.upload.title'),
      desc: t('dashboard.getting_started.steps.upload.desc'),
    },
    {
      id: 2,
      title: t('dashboard.getting_started.steps.review.title'),
      desc: t('dashboard.getting_started.steps.review.desc'),
    },
    {
      id: 3,
      title: isPro ? t('dashboard.getting_started.steps.generate_or_upgrade.pro_title') : t('dashboard.getting_started.steps.generate_or_upgrade.free_title'),
      desc: isPro ? t('dashboard.getting_started.steps.generate_or_upgrade.pro_desc') : t('dashboard.getting_started.steps.generate_or_upgrade.free_desc'),
    },
  ]

  return { title, description, steps }
}
