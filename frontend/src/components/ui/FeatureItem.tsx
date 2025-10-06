type Props = {
    feature: import('@/types/feature').Feature
  getCost?: (k?: string) => { usd: number; credits: number } | undefined
}

export default function FeatureItem({ feature, getCost }: Props) {
  const Icon = feature?.icon
  return (
    <div className={`h-full ${!feature.available ? 'opacity-60 bg-gray-50' : 'border-blue-200'}`}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className={`h-5 w-5 ${feature.available ? 'text-blue-600' : 'text-gray-400'}`} /> : null}
          <div className="font-medium flex items-center gap-2">
            {feature.title}
          </div>
        </div>
        <div className="text-sm text-gray-700 mt-2">{feature.description}</div>
        {getCost && (
          <div className="mt-2 text-sm text-gray-700">Cost: <span className="font-semibold">{getCost(feature.key)?.usd ? `$${getCost(feature.key)!.usd.toFixed(2)} / ${getCost(feature.key)!.credits} credits` : '—'}</span></div>
        )}
      </div>
    </div>
  )
}
