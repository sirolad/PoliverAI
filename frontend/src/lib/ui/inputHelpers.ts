import { cn } from '@/lib/utils'
import { twFromTokens, spacing } from '@/styles/styleTokens'

export function getInputClassName(extra?: string) {
  // Compose a base input token (from spacing.input) with remaining
  // UI utilities that aren't yet represented as tokens. Consumers may
  // pass an `extra` string (already tokenized or raw classes) which
  // will be appended.
  const base = twFromTokens(
    spacing.input,
    'h-10',
    'text-sm',
    'ring-offset-background',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50'
  )
  return cn(base, extra)
}
