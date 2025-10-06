export function getDangerButtonClass(extra?: string) {
  return `bg-red-600 text-white ${extra ?? ''}`.trim()
}

export function getConfirmDeleteLabel(isProcessing: boolean) {
  return isProcessing ? 'Deleting...' : 'Yes, Delete'
}
