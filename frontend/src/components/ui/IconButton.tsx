import * as React from 'react'
import { twFromTokens, spacing, alignment, buttons } from '@/styles/styleTokens'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
}

export default function IconButton({ className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={twFromTokens(spacing.iconWrapperCompact, alignment.center, buttons.base, className)}
      aria-label={props['aria-label'] ?? 'icon-button'}
    >
      {children}
    </button>
  )
}
