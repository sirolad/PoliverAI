type IconSpanProps = { children?: React.ReactNode }

export default function IconSpan({ children }: IconSpanProps) {
  if (!children) return null
  // flex-shrink-0 prevents the icon from shrinking and ensures it stays on the same line
  return <span className="btn-icon mr-2 flex-shrink-0">{children}</span>
}
