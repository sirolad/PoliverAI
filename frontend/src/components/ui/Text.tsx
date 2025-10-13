import React from 'react'
import { twFromTokens, fontPresets, textSizes, colors } from '@/styles/styleTokens'

type PresetKey = keyof typeof fontPresets
type SizeKey = keyof typeof textSizes
type ColorKey = keyof typeof colors

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'div' | 'span'
  preset?: PresetKey | SizeKey
  color?: ColorKey | string
}

export default function Text({ as = 'p', preset = 'body', color, className, children, ...rest }: Props) {
  const presetIsFontPreset = preset in fontPresets

  let sizeToken: { tw?: string } | undefined
  let weightToken: { tw?: string } | undefined

  if (presetIsFontPreset) {
    const kp = preset as PresetKey
    const p = fontPresets[kp]
    sizeToken = p.size
    weightToken = p.weight
  } else {
    const ks = preset as SizeKey
    sizeToken = textSizes[ks]
    weightToken = undefined
  }

  let colorToken: { tw?: string } | string | undefined
  if (color && (color as string) in colors) {
    colorToken = (colors as Record<string, { tw?: string }>)[color as string]
  } else {
    colorToken = color
  }

  const Component = as as React.ElementType

  return (
    <Component className={twFromTokens(sizeToken, weightToken, colorToken as string | { tw?: string } | undefined, className || '')} {...rest}>
      {children}
    </Component>
  )
}
