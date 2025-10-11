import useDashboardHeader from '@/hooks/useDashboardHeader'

export default function DashboardHeader() {
  const { title, subtitle } = useDashboardHeader()

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600">{subtitle}</p>
    </div>
  )
}
