export type FeatureItem = {
  // icon is RN-specific; keep as string key for now
  icon?: string
  title: string
  description: string
  isPro?: boolean
}

export function getFreeFeatures(): FeatureItem[] {
  return [
    {
      icon: 'file-check',
      title: 'Basic Policy Verification',
      description: 'Upload and analyze privacy policies for basic GDPR compliance checks using rule-based detection.'
    },
    {
      icon: 'shield',
      title: 'Essential Compliance Checks',
      description: 'Detect fundamental GDPR violations and get basic recommendations for improvement.'
    },
    {
      icon: 'clock',
      title: 'Fast Analysis',
      description: 'Quick compliance screening using our optimized rule-based analysis engine.'
    }
  ]
}

export function getProFeatures(): FeatureItem[] {
  return [
    {
      icon: 'zap',
      title: 'AI-Powered Deep Analysis',
      description: 'Advanced AI analysis that detects nuanced privacy violations and complex compliance issues.',
      isPro: true
    },
    {
      icon: 'bar-chart',
      title: 'Comprehensive Reporting',
      description: 'Detailed compliance reports with confidence scores, evidence, and actionable recommendations.',
      isPro: true
    },
    {
      icon: 'file-check',
      title: 'Policy Generation & Revision',
      description: 'Generate revised policies automatically based on detected compliance gaps.',
      isPro: true
    }
  ]
}
