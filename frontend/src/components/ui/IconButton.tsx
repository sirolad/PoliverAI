import * as React from 'react'
import { twFromTokens } from '@/styles/styleTokens'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
}

export default function IconButton({ className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={twFromTokens('p-2 inline-flex items-center justify-center rounded', className)}
      aria-label={props['aria-label'] ?? 'icon-button'}
    >
      {children}
    </button>
  )
}
