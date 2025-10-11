import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Upload, BarChart } from 'lucide-react'
import useQuickActions from '@/hooks/useQuickActions'
import { useNavigate } from 'react-router-dom'

type Props = {
  reportsCount?: number
}

export default function QuickActions({ reportsCount }: Props) {
  const { actions } = useQuickActions(reportsCount)
  const navigate = useNavigate()

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{/** localized in hook */}</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {actions.map((a) => a.visible && (
          <Card key={a.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(a.path)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${a.key === 'analyze' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {a.key === 'analyze' ? <Upload className="h-6 w-6 text-blue-600" /> : <BarChart className="h-6 w-6 text-green-600" />}
                </div>
                <div>
                  <CardTitle className="text-lg">{a.title}</CardTitle>
                  <CardDescription>{a.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
