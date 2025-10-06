type Props = { children?: React.ReactNode }

export default function MetaLine({ children }: Props) {
  if (!children) return null
  return <div className="text-xs text-gray-500 mt-1">{children}</div>
}
