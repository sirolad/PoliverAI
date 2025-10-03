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
// Analysis request types
export interface AnalysisRequest {
  file: File
  analysis_mode?: 'fast' | 'balanced' | 'detailed'
}
// Error handling
export interface ApiErrorDetails {
  message: string
  upgrade_required?: boolean
  requested_mode?: string
  available_mode?: string
}
// Frontend-specific types for UI state
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
