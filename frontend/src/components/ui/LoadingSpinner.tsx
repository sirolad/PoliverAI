import { twFromTokens, colors, baseFontSizes, fontWeights } from '@/styles/styleTokens'

export default function LoadingSpinner({
  message = 'Loading…',
  subtext,
  size = 'lg',
}: {
  message?: string
  subtext?: string
  size?: 'md' | 'lg'
}) {
  const outer = size === 'lg' ? 'w-40 h-40' : 'w-24 h-24'
  const icon = size === 'lg' ? 'h-20 w-20' : 'h-12 w-12'

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div className={twFromTokens('mx-auto flex items-center justify-center rounded-full shadow', outer, colors.surface)}>
          <svg className={twFromTokens('animate-spin', icon, colors.primary)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <div className={twFromTokens('mt-4', fontWeights.semibold, baseFontSizes.lg)}>{message}</div>
        {subtext ? <div className={twFromTokens('mt-2', baseFontSizes.sm, colors.textMutedLight)}>{subtext}</div> : null}
      </div>
    </div>
  )
}
