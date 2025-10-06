import { cn } from '@/lib/utils'

export function getCardClassName(extra?: string) {
  return cn('rounded-lg border bg-card text-card-foreground shadow-sm', extra)
}

export function getCardHeaderClassName(extra?: string) {
  return cn('flex flex-col space-y-1.5 p-6', extra)
}

export function getCardTitleClassName(extra?: string) {
  return cn('text-2xl font-semibold leading-none tracking-tight', extra)
}

export function getCardDescriptionClassName(extra?: string) {
  return cn('text-sm text-muted-foreground', extra)
}

export function getCardContentClassName(extra?: string) {
  return cn('p-6 pt-0', extra)
}

export function getCardFooterClassName(extra?: string) {
  return cn('flex items-center p-6 pt-0', extra)
}
