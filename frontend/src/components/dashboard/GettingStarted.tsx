// React import not required with the new JSX runtime
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Text from '@/components/ui/Text'
import { twFromTokens, colors, fontWeights, textSizes } from '@/styles/styleTokens'
import useGettingStarted from '@/hooks/useGettingStarted'

export default function GettingStarted() {
  const { title, description, steps } = useGettingStarted()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {steps.map((s) => (
            <div className="flex items-start gap-3" key={s.id}>
              <div className={twFromTokens('rounded-full flex items-center justify-center mt-0.5', 'w-6 h-6', colors.primaryBgLight, colors.primary, textSizes.sm, fontWeights.bold)}>
                {s.id}
              </div>
              <div>
                <h4 className={twFromTokens(fontWeights.semibold)}>{s.title}</h4>
                <Text preset="small" color="textMuted">{s.desc}</Text>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
