export default function LoadingSpinner({
  message = 'Loading…',
  subtext,
  size = 'lg',
}: {
  message?: string
  subtext?: string
  size?: 'md' | 'lg'
}) {
  const outer = size === 'lg' ? 'w-40 h-40' : 'w-24 h-24'
  const icon = size === 'lg' ? 'h-20 w-20' : 'h-12 w-12'

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div className={`mx-auto ${outer} flex items-center justify-center rounded-full bg-white shadow`}>
          <svg className={`animate-spin ${icon} text-indigo-600`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <div className="mt-4 text-lg font-semibold">{message}</div>
        {subtext ? <div className="mt-2 text-sm text-gray-500">{subtext}</div> : null}
      </div>
    </div>
  )
}
