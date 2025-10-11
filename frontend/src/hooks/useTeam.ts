import { t } from '@/i18n'

export default function useTeam() {
  const heading = t('landing.team.heading')
  const paragraph = t('landing.team.paragraph')

  return { heading, paragraph }
}
