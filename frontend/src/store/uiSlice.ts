import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type UIState = {
  selectedReport: string | null
}

const initialState: UIState = { selectedReport: null }

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedReport(state, action: PayloadAction<string | null>) {
      state.selectedReport = action.payload
    },
    clearSelectedReport(state) {
      state.selectedReport = null
    }
  }
});

export const { setSelectedReport, clearSelectedReport } = slice.actions
export default slice.reducer