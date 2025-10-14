import { useCallback } from 'react'

type Params = {
  setFile: (f: { uri: string; name?: string; type?: string } | null) => void
  // fileInputRef kept for web parity; in RN you'll use native pickers
  fileInputRef?: any
}

export default function useUploadZone({ setFile }: Params) {
  const onPressPick = useCallback(async () => {
    // TODO: Integrate react-native-document-picker or Expo DocumentPicker
    // For now this is a no-op placeholder
    setFile(null)
  }, [setFile])

  return { onPressPick }
}
