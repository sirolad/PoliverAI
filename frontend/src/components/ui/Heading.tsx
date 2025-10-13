import React from 'react'
import { twFromTokens, fontPresets, colors } from '@/styles/styleTokens'

type PresetKey = keyof typeof fontPresets
type ColorKey = keyof typeof colors

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: 'h1' | 'h2' | 'h3'
  preset?: PresetKey
  color?: ColorKey | string
}

export default function Heading({ as = 'h1', preset = 'heading', color, className, children, ...rest }: Props) {
  const presetObj = fontPresets[preset]

  const colorToken = color && (color as string) in colors ? (colors as Record<string, { tw?: string }>)[color as string] : color

  const Component = as as React.ElementType
  return (
    <Component className={twFromTokens(presetObj.size, presetObj.weight, colorToken as string | { tw?: string } | undefined, className || '')} {...rest}>
      {children}
    </Component>
  )
}
