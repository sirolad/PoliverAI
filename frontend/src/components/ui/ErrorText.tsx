type Props = { error?: unknown }

export default function ErrorText({ error }: Props) {
  if (!error) return null
  return <p className="text-sm text-red-600">{String(error)}</p>
}
