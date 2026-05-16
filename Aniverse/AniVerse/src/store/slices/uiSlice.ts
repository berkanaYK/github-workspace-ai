import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  theme: 'dark' | 'light' | 'system';
  activeContentFilter: string;
  searchQuery: string;
  isSearchActive: boolean;
}

const initialState: UiState = {
  theme: 'dark',
  activeContentFilter: 'all',
  searchQuery: '',
  isSearchActive: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'dark' | 'light' | 'system'>) => {
      state.theme = action.payload;
    },
    setContentFilter: (state, action: PayloadAction<string>) => {
      state.activeContentFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    toggleSearch: state => {
      state.isSearchActive = !state.isSearchActive;
      if (!state.isSearchActive) state.searchQuery = '';
    },
  },
});

export const { setTheme, setContentFilter, setSearchQuery, toggleSearch } = uiSlice.actions;
export default uiSlice.reducer;