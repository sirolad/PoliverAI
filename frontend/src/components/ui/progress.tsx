<<<<<<< HEAD
import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'
import { twFromTokens, colors, spacing } from '@/styles/styleTokens'
import { progressTransformStyle } from '@/lib/progressHelpers'
=======
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"
>>>>>>> main

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
<<<<<<< HEAD
      twFromTokens('relative w-full', spacing.progressBarContainer, colors.surfaceMuted),
=======
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
>>>>>>> main
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
<<<<<<< HEAD
      className={twFromTokens(spacing.progressBarInner, 'w-full transition-all', colors.primaryBg)}
      style={progressTransformStyle(value)}
=======
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
>>>>>>> main
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName
<<<<<<< HEAD
=======

>>>>>>> main
export { Progress }
