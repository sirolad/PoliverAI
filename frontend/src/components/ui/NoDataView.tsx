import { FileText, FileSearch, CreditCard, Lock, Search } from 'lucide-react'

export default function NoDataView({
  title = 'No detailed content yet',
  message = 'This report has not been generated or persisted yet. Try generating the Full Report or refresh later.',
  iconSize = 'lg',
  iconType = 'default',
  customIcon,
}: {
  title?: string
  message?: string
  iconSize?: 'md' | 'lg'
  iconType?: 'report' | 'analysis' | 'transactions' | 'locked' | 'search' | 'default'
  customIcon?: React.ReactElement
}) {
  const iconClass = iconSize === 'lg' ? 'h-20 w-20' : 'h-12 w-12'
  const outer = iconSize === 'lg' ? 'w-40 h-40' : 'w-24 h-24'

  const iconForType = (type: string) => {
    switch (type) {
      case 'report':
        return <FileText className={`${iconClass} text-gray-400`} aria-hidden />
      case 'analysis':
        return <FileSearch className={`${iconClass} text-gray-400`} aria-hidden />
      case 'transactions':
        return <CreditCard className={`${iconClass} text-gray-400`} aria-hidden />
      case 'locked':
        return <Lock className={`${iconClass} text-gray-400`} aria-hidden />
      case 'search':
        return <Search className={`${iconClass} text-gray-400`} aria-hidden />
      default:
        return (
          <svg className={`${iconClass} text-gray-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <circle cx="9.5" cy="13.5" r="2.5" />
            <line x1="11.5" y1="15.5" x2="13.5" y2="17.5" />
            <path d="M9 9.5a1.5 1.5 0 1 1 3 0c0 1.5-1.5 1.5-1.5 1.5" />
            <path d="M11 13.5h.01" />
          </svg>
        )
    }
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center p-6">
        <div className={`mx-auto ${outer} flex items-center justify-center rounded-full bg-gray-100`}>
          {customIcon ?? iconForType(iconType)}
        </div>
        <div className="mt-4 text-xl font-semibold">{title}</div>
        <div className="mt-2 text-sm text-gray-500">{message}</div>
      </div>
    </div>
  )
}
