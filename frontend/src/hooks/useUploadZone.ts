import type React from 'react'

type Params = {
  setFile: (f: File | null) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

export default function useUploadZone({ setFile, fileInputRef }: Params) {
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer?.files?.[0]
    if (f) setFile(f)
  }

  const onClick = () => {
    fileInputRef.current?.click()
  }

  return { onDragOver, onDrop, onClick }
}
