import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '@/i18n'

export default function usePricing() {
  const navigate = useNavigate()

  const freePlan = {
    title: t('landing.pricing.free_title'),
    price: t('landing.pricing.free_price'),
    desc: t('landing.pricing.free_desc'),
    features: [
      'Basic policy verification',
      'Rule-based compliance checks',
      'Fast analysis mode',
      'Basic recommendations',
    ],
    onGetStarted: useCallback(() => navigate('/signup'), [navigate]),
  }

  const proPlan = {
    title: t('landing.pricing.pro_title'),
    price: t('landing.pricing.pro_price'),
    period: t('landing.pricing.pro_period'),
    desc: t('landing.pricing.pro_desc') || '',
    features: [
      'Everything in Free',
      'AI-powered deep analysis',
      'Comprehensive reporting',
      'Policy generation & revision',
      'Priority support',
    ],
    onUpgrade: useCallback(() => navigate('/login'), [navigate]),
  }

  const pricing = {
    title: t('landing.pricing.title') || '',
    desc: t('landing.pricing.subtitle') || '',
    popular: t('landing.pricing.popular') || '',
  }

  return { freePlan, proPlan, pricing }
}
