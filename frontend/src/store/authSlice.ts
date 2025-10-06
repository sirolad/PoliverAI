import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type AuthState = {
  token: string | null
}

const initialState: AuthState = { token: null }

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload
    },
    clearToken(state) {
      state.token = null
    }
  }
})

export const { setToken, clearToken } = slice.actions
export default slice.reducer
