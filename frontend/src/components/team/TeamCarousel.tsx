import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { t } from '@/i18n'

type Member = {
  id: number
  name: string
  title?: string
  img?: string | null
  quote: string
}

const MEMBERS: Member[] = [
  { id: 1, name: 'Gabriel Dagadu', title: 'Team Member 1', img: '/team-members/2.png', quote: 'When we teach machines to think, we must also teach them to care.' },
  { id: 2, name: 'Surajudeen Akande', title: 'Team Member 2', img: '/team-members/1.jpeg', quote: 'AI amplifies human creativity and helps us solve previously intractable problems.' },
  { id: 3, name: 'El-Moatasem Madani', title: 'Team Member 3', img: '/team-members/3.png', quote: 'Automation liberates humans to focus on what matters most.' },
  { id: 4, name: 'Labius Ramono Disemelo', title: 'Team Member 4', img: '/team-members/4.jpg', quote: 'Robust systems and compassionate design go hand in hand.' },
  { id: 5, name: 'Hafiz Syed Ashir Hassan', title: 'Team Member 5', img: '/team-members/5.jpg', quote: 'Open data and AI can build a fairer future for everyone.' },
  { id: 6, name: 'Foster Luh', title: 'Team Member 6', img: '/team-members/6.jpg', quote: 'AI must be built with empathy and a focus on human dignity.' },
  { id: 7, name: 'Syed Abrar Ahmad', title: 'Team Member 7', img: '/team-members/7.png', quote: 'Security and privacy are the foundations of trust in AI.' },
  { id: 8, name: 'Timothy Kasenge', title: 'Team Member 8', img: '/team-members/8.png', quote: 'Efficient algorithms enable meaningful AI at scale.' },
  { id: 9, name: 'Keplet Saintil', title: 'Team Member 9', img: '/team-members/9.png', quote: 'Language is the bridge between human intent and machine understanding.' },
  { id: 10, name: 'Elijah Rwothoromo', title: 'Team Member 10', img: '/team-members/10.jpg', quote: 'Innovation combines curiosity with disciplined engineering.' },
  { id: 11, name: 'Roger Okello', title: 'Team Member 11', img: '/team-members/11.png', quote: 'Quality assurance ensures reliability and user confidence.' },
  { id: 12, name: 'Seun Odewale', title: 'Team Member 12', img: '/team-members/12.jpg', quote: 'Strong IT foundations make resilient products possible.' },
  { id: 13, name: 'Abraham Omomoh', title: 'Team Member 13', img: '/team-members/13.jpg', quote: 'Inspiration drives teams to turn ideas into impact.' },
]

function Avatar({ img, name }: { img?: string | null; name: string }) {
  if (img) {
    return <img src={img} alt={name} className="w-28 h-28 rounded-full object-cover" />
  }
  // simple placeholder stacked circles (larger)
  return (
    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xl font-semibold text-gray-700">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3.6" stroke="#4B5563" strokeWidth="1.2" fill="#F3F4F6" />
        <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="#4B5563" strokeWidth="1.2" fill="#F3F4F6" />
      </svg>
    </div>
  )
}

export default function TeamCarousel() {
  const [perView, setPerView] = React.useState<number>(() => {
    if (typeof window === 'undefined') return 3
    return window.innerWidth < 768 ? 1 : 3
  })

  const [index, setIndex] = React.useState(0)

  // adjust perView on viewport changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (ev: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in ev ? ev.matches : (ev as MediaQueryList).matches
      setPerView(matches ? 1 : 3)
    }
    // initial
    handler(mq)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener(handler)
    }
  }, [])

  // clamp index when perView changes
  React.useEffect(() => {
    const maxIdx = Math.max(0, Math.ceil(MEMBERS.length / perView) - 1)
    setIndex((i) => Math.min(i, maxIdx))
  }, [perView])

  const maxIndex = Math.max(0, Math.ceil(MEMBERS.length / perView) - 1)

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(maxIndex, i + 1))

  const start = index * perView
  const slice = MEMBERS.slice(start, start + perView)

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header: centered title + subtitle */}
      <div className="text-center mb-6">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">{t('team_carousel.title')}</h3>
        <p className="text-lg text-gray-600">{t('team_carousel.subtitle')}</p>
      </div>

      <div className="relative">
        {/* Left nav button - positioned at the left edge */}
        <button aria-label={t('team_carousel.aria_prev')} onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow hover:bg-gray-50">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>

        {/* Right nav button - positioned at the right edge */}
        <button aria-label={t('team_carousel.aria_next')} onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow hover:bg-gray-50">
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </button>

        <div className="p-6 mx-8">
          <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))` }}>
            {slice.map((m) => (
              <div key={m.id} className="flex flex-col items-center text-center p-10 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow transform-gpu">
                <Avatar img={m.img} name={m.name} />
                <div className="mt-4">
                  <div className="font-semibold text-lg">{m.name}</div>
                  <div className="text-sm text-gray-500">{m.title}</div>
                  <p className="mt-3 text-sm text-gray-600 italic">“{m.quote}”</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
