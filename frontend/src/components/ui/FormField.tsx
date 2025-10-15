import * as React from 'react'
import ErrorText from './ErrorText'
import { twFromTokens, baseFontSizes, fontWeights, colors, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  id: string
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  error?: string | boolean | undefined
}

export default function FormField({ id, label, icon, children, error }: Props) {
  return (
    <div className={twFromTokens(alignment.flexCol, alignment.gap2)}>
      <label htmlFor={id} className={twFromTokens(baseFontSizes.sm, fontWeights.medium, colors.textSecondary)}>
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className={twFromTokens('absolute left-3 top-1/2 transform -translate-y-1/2', spacing.iconsXs, colors.textMuted)}>{icon}</span>
        ) : null}
        {children}
      </div>
      <ErrorText error={error} />
    </div>
  )
}
