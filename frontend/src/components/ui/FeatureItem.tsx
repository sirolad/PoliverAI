import { twFromTokens, colors, baseFontSizes, fontWeights } from '@/styles/styleTokens'

type Props = {
    feature: import('@/types/feature').Feature
  getCost?: (k?: string) => { usd: number; credits: number } | undefined
}

export default function FeatureItem({ feature, getCost }: Props) {
  const Icon = feature?.icon
  const containerBg = !feature.available ? 'opacity-60' : ''
  const surfaceBg = !feature.available ? colors.surfaceMuted : undefined
  const borderToken = feature.available ? 'border-blue-200' : undefined
  return (
    <div className={twFromTokens('h-full', containerBg, surfaceBg, borderToken)}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className={twFromTokens('h-5 w-5', feature.available ? colors.primary : colors.textMuted)} /> : null}
          <div className={twFromTokens(fontWeights.medium, 'flex items-center gap-2')}>{feature.title}</div>
        </div>
        <div className={twFromTokens(baseFontSizes.sm, colors.textSecondary, 'mt-2')}>{feature.description}</div>
        {getCost && (
          <div className={twFromTokens('mt-2', baseFontSizes.sm, colors.textSecondary)}>Cost: <span className={twFromTokens(fontWeights.semibold)}>{getCost(feature.key)?.usd ? `$${getCost(feature.key)!.usd.toFixed(2)} / ${getCost(feature.key)!.credits} credits` : '—'}</span></div>
        )}
      </div>
    </div>
  )
}
