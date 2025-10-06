export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function footerClasses(hasBackground: boolean) {
  const bgClass = hasBackground ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-700'
  const subtitleClass = hasBackground ? 'text-blue-100' : 'text-gray-500'
  return { bgClass, subtitleClass }
}
