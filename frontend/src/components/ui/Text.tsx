import React from 'react'
import { twFromTokens, fontPresets, textSizes, colors, spacing } from '@/styles/styleTokens'

type PresetKey = keyof typeof fontPresets
type SizeKey = keyof typeof textSizes
type ColorKey = keyof typeof colors

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'div' | 'span'
  preset?: PresetKey | SizeKey
  color?: ColorKey | string
  // optional text alignment controlled at the component level
  align?: 'left' | 'center' | 'right' | 'justify'
  // optional spacing token key to add spacing classes (e.g., 'smallTop')
  space?: keyof typeof spacing
}

export default function Text({ as = 'p', preset = 'body', color, className, children, align, space, ...rest }: Props) {
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

  // map simple align prop to tailwind text alignment utilities
  const alignClass = align ? (align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : align === 'justify' ? 'text-justify' : 'text-left') : undefined

  // map optional spacing token
  const spacingToken = space ? spacing[space] : undefined

  return (
    <Component className={twFromTokens(sizeToken, weightToken, colorToken as string | { tw?: string } | undefined, spacingToken, alignClass, className || '')} {...rest}>
      {children}
    </Component>
  )
}
