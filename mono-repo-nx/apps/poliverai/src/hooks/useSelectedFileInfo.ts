import { useState } from 'react'

export default function useSelectedFileInfo(initial: any = null) {
  const [file, setFile] = useState<any | null>(initial)
  return { file, setFile }
}
