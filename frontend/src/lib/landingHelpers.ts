import type { ElementType } from 'react'
import { FileCheck, Shield, Clock, Zap, BarChart } from 'lucide-react'

export type FeatureItem = {
  icon: ElementType
  title: string
  description: string
  isPro?: boolean
}

export function getFreeFeatures(): FeatureItem[] {
  return [
    {
      icon: FileCheck,
      title: 'Basic Policy Verification',
      description: 'Upload and analyze privacy policies for basic GDPR compliance checks using rule-based detection.'
    },
    {
      icon: Shield,
      title: 'Essential Compliance Checks',
      description: 'Detect fundamental GDPR violations and get basic recommendations for improvement.'
    },
    {
      icon: Clock,
      title: 'Fast Analysis',
      description: 'Quick compliance screening using our optimized rule-based analysis engine.'
    }
  ]
}

export function getProFeatures(): FeatureItem[] {
  return [
    {
      icon: Zap,
      title: 'AI-Powered Deep Analysis',
      description: 'Advanced AI analysis that detects nuanced privacy violations and complex compliance issues.',
      isPro: true
    },
    {
      icon: BarChart,
      title: 'Comprehensive Reporting',
      description: 'Detailed compliance reports with confidence scores, evidence, and actionable recommendations.',
      isPro: true
    },
    {
      icon: FileCheck,
      title: 'Policy Generation & Revision',
      description: 'Generate revised policies automatically based on detected compliance gaps.',
      isPro: true
    }
  ]
}
