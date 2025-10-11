import { t } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { BarChart } from 'lucide-react'
import useCTA from '@/hooks/useCTA'

export default function CTASection() {
  const { onStartFree } = useCTA()

  return (
    <div className="bg-blue-600 text-white py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">{t('landing.cta.heading')}</h2>
        <p className="text-xl mb-8 text-blue-100">{t('landing.cta.paragraph')}</p>
        <Button size="lg" variant="secondary" onClick={onStartFree} className="justify-center mx-auto w-fit" icon={<BarChart className="h-5 w-5" />} iconColor="text-black">
          {t('landing.buttons.start_free_cta')}
        </Button>
      </div>
    </div>
  )
}
