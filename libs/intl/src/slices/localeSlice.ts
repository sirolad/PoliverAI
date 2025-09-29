import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type LocaleState = {
  locale: string;
};

const initialState: LocaleState = {
  locale: 'en-CA',
};

const slice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLocale(state, action: PayloadAction<string>) {
      state.locale = action.payload;
    },
  },
});

export const { setLocale } = slice.actions;
export default slice.reducer;
