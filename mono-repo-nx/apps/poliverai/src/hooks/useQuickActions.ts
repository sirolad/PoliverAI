import { useTranslation, useAuth } from '@poliverai/intl'

export type QuickAction = {
  key: string
  title: string
  desc: string
  path: string
  visible: boolean
}

export default function useQuickActions(reportsCount?: number) {
  const { t } = useTranslation()
  const auth = useAuth() as unknown as { isPro?: boolean }
  const isPro = !!auth?.isPro

  const analyze: QuickAction = {
    key: 'analyze',
    title: t('dashboard.analyze_new_policy.title'),
    desc: t('dashboard.analyze_new_policy.desc'),
    path: '/analyze',
    visible: true,
  }

  const viewReports: QuickAction = {
    key: 'view_reports',
    title: t('dashboard.view_reports.title'),
    desc: t('dashboard.view_reports.desc'),
    path: '/reports',
    visible: !!isPro || (typeof reportsCount === 'number' && reportsCount > 0),
  }

  return { actions: [analyze, viewReports] }
}
