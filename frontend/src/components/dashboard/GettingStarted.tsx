// React import not required with the new JSX runtime
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
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
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                {s.id}
              </div>
              <div>
                <h4 className="font-medium">{s.title}</h4>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
