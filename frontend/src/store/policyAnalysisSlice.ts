import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { ComplianceResult } from '@/types/api'

export type PolicyAnalysisState = {
  fileName?: string | null
  progress?: number
  message?: string
  result?: ComplianceResult | null
  reportFilename?: string | null
  isFullReportGenerated?: boolean
}

const initialState: PolicyAnalysisState = {
  fileName: null,
  progress: 0,
  message: '',
  result: null,
  reportFilename: null,
  isFullReportGenerated: false,
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
