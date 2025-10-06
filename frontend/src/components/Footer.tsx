import { getCurrentYear, footerClasses } from '@/lib/uiHelpers'

type FooterProps = {
  hasBackground?: boolean
}

export default function Footer({ hasBackground = true }: FooterProps) {
  const { bgClass, subtitleClass } = footerClasses(hasBackground)

  return (
    <footer className={`${bgClass} py-6`}>
      <div className="container mx-auto px-4 flex flex-col items-center text-center gap-4">
        <div className={`text-sm ${subtitleClass} max-w-xl`}>
          Fast, simple GDPR compliance checks
        </div>

        <div className={`text-sm md:text-base max-w-xl ${hasBackground ? '' : 'text-gray-600'}`}>
          A quick, reliable privacy policy analysis — get results fast and act with confidence.
        </div>

        <div className={`${subtitleClass} text-sm mt-2`}>
          &copy; {getCurrentYear()} PoliverAI &trade;. All rights reserved.
        </div>

        <div className={hasBackground ? 'bg-white p-3 rounded-lg shadow-sm' : 'p-3'}>
          <img src="/poliverai-logo.svg" alt="PoliverAI" className="h-12 w-auto" />
        </div>
      </div>
    </footer>
  )
}
