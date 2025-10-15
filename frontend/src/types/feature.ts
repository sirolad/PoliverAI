import type { ElementType } from 'react'

export type Feature = {
  icon: ElementType
  title: string
  description: string
  available?: boolean
  key?: string
  isPro?: boolean
}
