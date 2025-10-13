import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Upload, BarChart } from 'lucide-react'
import useQuickActions from '@/hooks/useQuickActions'
import { useNavigate } from 'react-router-dom'
import { twFromTokens, textSizes, colors } from '@/styles/styleTokens'

type Props = {
  reportsCount?: number
}

export default function QuickActions({ reportsCount }: Props) {
  const { actions } = useQuickActions(reportsCount)
  const navigate = useNavigate()

  return (
    <div className="mb-8">
      <h2 className={twFromTokens(textSizes.h2, 'font-semibold', colors.textPrimary, 'mb-4')}>{/** localized in hook */}</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {actions.map((a) => a.visible && (
          <Card key={a.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(a.path)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={twFromTokens('p-2 rounded-lg', a.key === 'analyze' ? colors.primaryBgLight : colors.successBg)}>
                  {a.key === 'analyze' ? <Upload className={twFromTokens('h-6 w-6', colors.primary)} /> : <BarChart className={twFromTokens('h-6 w-6', colors.success)} />}
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
