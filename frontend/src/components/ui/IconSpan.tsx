type IconSpanProps = { children?: React.ReactNode }

export default function IconSpan({ children }: IconSpanProps) {
  if (!children) return null
  return <span className="btn-icon mr-2">{children}</span>
}
