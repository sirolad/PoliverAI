import type { ReactNode } from 'react'

type Props = {
  loading: boolean
  loadingNode?: ReactNode
  normalNode?: ReactNode
}

export default function LoadingLabel({ loading, loadingNode, normalNode }: Props) {
  return <>{loading ? loadingNode ?? null : normalNode ?? null}</>
}
