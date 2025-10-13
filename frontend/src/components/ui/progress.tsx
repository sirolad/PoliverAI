import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'
import { twFromTokens, colors } from '@/styles/styleTokens'
import { progressTransformStyle } from '@/lib/progressHelpers'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      twFromTokens('relative h-4 w-full overflow-hidden rounded-full', colors.surfaceMuted),
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={twFromTokens('h-full w-full flex-1 transition-all', colors.primaryBg)}
      style={progressTransformStyle(value)}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName
export { Progress }
