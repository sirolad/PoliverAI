import { t } from '@/i18n'

export default function useHowItWorks() {
  const steps = [
    {
      id: 1,
      title: t('landing.how.step1_title'),
      desc: t('landing.how.step1_desc'),
    },
    {
      id: 2,
      title: t('landing.how.step2_title'),
      desc: t('landing.how.step2_desc'),
    },
    {
      id: 3,
      title: t('landing.how.step3_title'),
      desc: t('landing.how.step3_desc'),
    },
  ]

  return { steps }
}
