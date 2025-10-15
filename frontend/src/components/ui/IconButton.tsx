import * as React from 'react'
import { twFromTokens, spacing, alignment } from '@/styles/styleTokens'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
}

export default function IconButton({ className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={twFromTokens(spacing.iconWrapper, alignment.center, className)}
      aria-label={props['aria-label'] ?? 'icon-button'}
    >
      {children}
    </button>
  )
}
