import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  theme: boolean;        // true = light, false = dark
}

const initialState: ThemeState = {
  theme: false,           // default fallback (will be overridden on client)
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = !state.theme;
    },
    setTheme: (state, action: PayloadAction<boolean>) => {
      state.theme = action.payload;
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

export default themeSlice.reducer;