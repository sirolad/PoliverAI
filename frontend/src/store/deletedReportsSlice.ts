import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type DeletedEvent = { ts: number; counts: { full: number; revision: number; free: number }; filenames?: string[] }

type DeletedReportsState = {
  events: DeletedEvent[]
  legacyCounts: { full: number; revision: number; free: number }
}

const initialState: DeletedReportsState = { events: [], legacyCounts: { full: 0, revision: 0, free: 0 } }

const slice = createSlice({
  name: 'deletedReports',
  initialState,
  reducers: {
    pushEvent(state: DeletedReportsState, action: PayloadAction<DeletedEvent>) {
      state.events.push(action.payload)
    },
    addToLegacy(state: DeletedReportsState, action: PayloadAction<{ full?: number; revision?: number; free?: number }>) {
      state.legacyCounts.full = (state.legacyCounts.full || 0) + (action.payload.full || 0)
      state.legacyCounts.revision = (state.legacyCounts.revision || 0) + (action.payload.revision || 0)
      state.legacyCounts.free = (state.legacyCounts.free || 0) + (action.payload.free || 0)
    },
    setEvents(state: DeletedReportsState, action: PayloadAction<DeletedEvent[]>) {
      state.events = action.payload
    }
  }
})

export const { pushEvent, addToLegacy, setEvents } = slice.actions
export default slice.reducer

// Helper used by components to compute counts in a date range
export const computeDeletedCountsForRange = (events: DeletedEvent[], legacy: { full: number; revision: number; free: number }, range: { from: string | null; to: string | null }) => {
  if (!events || events.length === 0) return legacy
  const fromTs = range && range.from ? new Date(range.from).setHours(0, 0, 0, 0) : null
  const toTs = range && range.to ? new Date(range.to).setHours(23, 59, 59, 999) : null
  const selected = events.filter((e) => { if (fromTs && e.ts < fromTs) return false; if (toTs && e.ts > toTs) return false; return true })
  return selected.reduce((acc, e) => ({ full: acc.full + (e.counts.full || 0), revision: acc.revision + (e.counts.revision || 0), free: acc.free + (e.counts.free || 0) }), { full: 0, revision: 0, free: 0 })
}
