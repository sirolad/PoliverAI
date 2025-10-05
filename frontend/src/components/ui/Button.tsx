import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import "./button-collapse.css"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Optional icon node to render before the children */
  icon?: React.ReactNode
  /** When true the button will collapse to icon-only on small screens (<=700px) */
  collapseToIcon?: boolean
  /** Icon color theme: 'dark' -> use dark icon (for light backgrounds), 'light' -> use light icon (for colored backgrounds), 'auto' -> infer from variant/className */
  iconTheme?: 'dark' | 'light' | 'auto'
  /** When false disables the collapse behavior even if collapseToIcon is true */
  canCollapse?: boolean
  /** When false the button will render without background-related utility classes (text-only) */
  hasBackground?: boolean
  /** Explicit icon color class (e.g. 'text-red-600'). When provided it overrides iconTheme/auto. */
  iconColor?: string
  /** If true, the button text will be underlined. Defaults to false. */
  textUnderline?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, collapseToIcon = false, iconTheme = 'auto', canCollapse = true, hasBackground = true, iconColor, textUnderline = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const collapseClass = collapseToIcon && canCollapse ? 'collapse-to-icon' : ''
    // Determine icon color class based on explicit prop or heuristics
    const determineIconColorClass = (): string => {
      // explicit override
      if (typeof iconColor === 'string' && iconColor.trim().length > 0) return iconColor
      if (iconTheme === 'dark') return 'text-black'
      if (iconTheme === 'light') return 'text-white'
      // auto-detect
      const cnLower = String(className || '').toLowerCase()
      // If variant suggests a neutral/outline/ghost button or background is white-ish -> dark icon
      if (variant === 'outline' || variant === 'ghost' || variant === 'link') return 'text-black'
      if (cnLower.includes('bg-white') || cnLower.includes('bg-gray-50') || cnLower.includes('bg-gray-100') || cnLower.includes('bg-gray-200') || cnLower.includes('border')) return 'text-black'
      // default to light icon for colored backgrounds
      return 'text-white'
    }

    const iconColorClass = determineIconColorClass()

    let iconNode: React.ReactNode = null
    if (icon) {
      if (React.isValidElement(icon)) {
        const el = icon as React.ReactElement<Record<string, unknown>>
        const propsObj = el.props as Record<string, unknown>
        const prev = typeof propsObj.className === 'string' ? propsObj.className : ''
        // append color class so it overrides when possible
        const merged = `${prev} ${iconColorClass}`.trim()
        iconNode = React.cloneElement(el, { className: merged })
      } else {
        iconNode = <span className={iconColorClass}>{icon}</span>
      }
    }

    // compose classes then optionally strip background-related utilities
    let composed = cn(buttonVariants({ variant, size, className }), collapseClass)
    if (!hasBackground) {
      // remove bg-*, border, shadow, ring classes that influence background/outline
      composed = composed
        .replace(/\bbg-[^\s]+\b/g, '')
        .replace(/\b(border|shadow|ring-[^\s]+|ring-offset-[^\s]+)\b/g, '')
        .replace(/\s+/g, ' ').trim()
      // ensure transparent background
      composed = `${composed} bg-transparent`
    }
    // control underline on text label
    if (textUnderline) {
      if (!/\bunderline\b/.test(composed)) composed = `${composed} underline`
    } else {
      composed = composed.replace(/\bunderline\b/g, '').replace(/\s+/g, ' ').trim()
    }

    return (
      <Comp
        className={composed}
        ref={ref}
        {...props}
      >
        {iconNode ? <span className="btn-icon mr-2">{iconNode}</span> : null}
        <span className="btn-label">{props.children}</span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
export default Button
