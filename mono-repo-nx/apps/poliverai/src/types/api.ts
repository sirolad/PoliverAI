// Auth Types
export interface UserLogin {
  email: string
  password: string
}
export interface UserCreate {
  name: string
  email: string
  password: string
}
export interface User {
  id: string
  name: string
  email: string
  tier: 'free' | 'pro'
  credits: number
  subscription_credits?: number
  subscription_expires?: string
  created_at: string
  is_active: boolean
}
export interface Token {
  access_token: string
  token_type: string
  user: User
}
// Policy Analysis Types
export interface ClauseMatch {
  article: string
  policy_excerpt: string
  score: number
}
export interface Finding {
  article: string
  issue: string
  severity: 'high' | 'medium' | 'low'
  confidence: number
}
export interface Recommendation {
  article: string
  suggestion: string
}
export interface ComplianceMetrics {
  total_violations: number
  total_fulfills: number
  critical_violations: number
}
export interface ComplianceResult {
  verdict: string
  score: number
  confidence: number
  evidence: ClauseMatch[]
  findings: Finding[]
  recommendations: Recommendation[]
  summary: string
  metrics: ComplianceMetrics
}
export interface AnalysisRequest {
  file: File
  analysis_mode?: 'fast' | 'balanced' | 'detailed'
}
export interface ApiErrorDetails {
  message: string
  upgrade_required?: boolean
  requested_mode?: string
  available_mode?: string
}
export interface AnalysisResultForUI extends Omit<ComplianceResult, 'findings'> {
  id: string
  filename: string
  analysisType: 'basic' | 'ai'
  timestamp: Date
  reportUrl?: string
  violations: Array<{
    category: string
    severity: 'high' | 'medium' | 'low'
    description: string
    recommendation: string
    confidence?: number
  }>
}

export interface ReportMetadata {
  filename: string
  title: string
  type: 'verification' | 'revision' | 'other'
  created_at: string
  file_size: number
  document_name: string
  analysis_mode?: 'fast' | 'balanced' | 'detailed'
  gcs_url?: string
  path?: string
  verdict?: string
  score?: number
  is_full_report?: boolean
  status?: string
}

