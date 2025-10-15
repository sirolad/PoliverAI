import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Upload, BarChart } from 'lucide-react'
import useQuickActions from '@/hooks/useQuickActions'
import { useNavigate } from 'react-router-dom'
import { twFromTokens, textSizes, colors, spacing, alignment, fontWeights } from '@/styles/styleTokens'

type Props = {
  reportsCount?: number
}

export default function QuickActions({ reportsCount }: Props) {
  const { actions } = useQuickActions(reportsCount)
  const navigate = useNavigate()

  return (
    <div className={twFromTokens(spacing.headingLarge)}>
      <h2 className={twFromTokens(textSizes.h2, fontWeights.semibold, colors.textPrimary, spacing.headingMargin)}>{/** localized in hook */}</h2>
      <div className={twFromTokens('grid md:grid-cols-2', alignment.gap4)}>
        {actions.map((a) => a.visible && (
          <Card key={a.key} className={twFromTokens('cursor-pointer transition-shadow hover:shadow-md')} onClick={() => navigate(a.path)}>
            <CardHeader>
              <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap3)}>
                <div className={twFromTokens(spacing.iconWrapperCompact, (a.key === 'analyze' ? colors.primaryBgLight : colors.successBg))}>
                  {a.key === 'analyze' ? <Upload className={twFromTokens(spacing.iconsMd, colors.primary)} /> : <BarChart className={twFromTokens(spacing.iconsMd, colors.success)} />}
                </div>
                <div>
                  <CardTitle className={twFromTokens(textSizes.lg)}>{a.title}</CardTitle>
                  <CardDescription className={twFromTokens(textSizes.sm, colors.textMuted)}>{a.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
