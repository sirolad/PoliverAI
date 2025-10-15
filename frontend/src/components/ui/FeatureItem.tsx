import { twFromTokens, colors, baseFontSizes, fontWeights, spacing, alignment } from '@/styles/styleTokens'

type Props = {
    feature: import('@/types/feature').Feature
  getCost?: (k?: string) => { usd: number; credits: number } | undefined
}

export default function FeatureItem({ feature, getCost }: Props) {
  const Icon = feature?.icon
  const containerBg = !feature.available ? 'opacity-60' : ''
  const surfaceBg = !feature.available ? colors.surfaceMuted : undefined
  const borderToken = feature.available ? colors.primaryBorder : undefined
  return (
    <div className={twFromTokens('h-full', containerBg, surfaceBg, borderToken)}>
      <div className={twFromTokens(spacing.card)}>
        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
          {Icon ? <Icon className={twFromTokens(spacing.iconsMd, feature.available ? colors.primary : colors.textMuted)} /> : null}
          <div className={twFromTokens(fontWeights.medium, alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>{feature.title}</div>
        </div>
        <div className={twFromTokens(baseFontSizes.sm, colors.textSecondary, spacing.smallTop)}>{feature.description}</div>
        {getCost && (
          <div className={twFromTokens(spacing.smallTop, baseFontSizes.sm, colors.textSecondary)}>Cost: <span className={twFromTokens(fontWeights.semibold)}>{getCost(feature.key)?.usd ? `$${getCost(feature.key)!.usd.toFixed(2)} / ${getCost(feature.key)!.credits} credits` : '—'}</span></div>
        )}
      </div>
    </div>
  )
}
