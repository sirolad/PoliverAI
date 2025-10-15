import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { ComplianceResult } from '@/types/api'

export type PolicyAnalysisState = {
  fileName?: string | null
  progress?: number
  message?: string
  result?: ComplianceResult | null
  reportFilename?: string | null
  revisedReportFilename?: string | null
  isFullReportGenerated?: boolean
  // Persisted UI additions so the analysis screen can be fully restored
  detailedContent?: string | null
  detailedReport?: Record<string, unknown> | null
  revisedPolicy?: Record<string, unknown> | null
  activeTab?: 'free' | 'full' | 'revised'
  loadingDetailed?: boolean
  loadingRevised?: boolean
}

const initialState: PolicyAnalysisState = {
  fileName: null,
  progress: 0,
  message: '',
  result: null,
  reportFilename: null,
  revisedReportFilename: null,
  isFullReportGenerated: false,
  detailedContent: null,
  detailedReport: null,
  revisedPolicy: null,
  activeTab: 'free',
  loadingDetailed: false,
  loadingRevised: false,
}

const slice = createSlice({
  name: 'policyAnalysis',
  initialState,
  reducers: {
    setState(state, action: PayloadAction<Partial<PolicyAnalysisState>>) {
      return { ...state, ...action.payload }
    },
    resetState() {
      return initialState
    },
  },
})

export const { setState, resetState } = slice.actions
export default slice.reducer
