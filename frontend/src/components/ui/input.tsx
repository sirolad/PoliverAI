import * as React from "react"
import { getInputClassName } from '@/lib/ui/inputHelpers'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={getInputClassName(className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export default Input