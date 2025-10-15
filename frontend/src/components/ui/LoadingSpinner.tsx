import { twFromTokens, colors, baseFontSizes, fontWeights, spacing, alignment } from '@/styles/styleTokens'

export default function LoadingSpinner({
  message = 'Loading…',
  subtext,
  size = 'lg',
}: {
  message?: string
  subtext?: string
  size?: 'md' | 'lg'
}) {
  const outer = size === 'lg' ? spacing.emptyOuterLg : spacing.emptyOuterMd
  const icon = size === 'lg' ? spacing.emptyIconLg : spacing.emptyIconMd

  return (
    <div className={twFromTokens('h-full w-full', alignment.center)}>
      <div className={twFromTokens('text-center')}>
        <div className={twFromTokens('mx-auto flex items-center justify-center rounded-full shadow', outer, colors.surface)}>
          <svg className={twFromTokens('animate-spin', icon, colors.primary)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <div className={twFromTokens(spacing.sectionButtonTop, fontWeights.semibold, baseFontSizes.lg)}>{message}</div>
        {subtext ? <div className={twFromTokens(spacing.smallTop, baseFontSizes.sm, colors.textMutedLight)}>{subtext}</div> : null}
      </div>
    </div>
  )
}
