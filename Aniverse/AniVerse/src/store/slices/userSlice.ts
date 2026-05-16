import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserProgress, WatchStatus } from '../../types';

interface UserState {
  progressMap: Record<string, UserProgress>;
  favorites: string[];
  history: string[];
}

const initialState: UserState = {
  progressMap: {},
  favorites: [],
  history: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateProgress: (
      state,
      action: PayloadAction<Partial<UserProgress> & { contentId: string; userId: string }>
    ) => {
      const { contentId } = action.payload;
      const existing = state.progressMap[contentId];
      state.progressMap[contentId] = {
        ...existing,
        ...action.payload,
        updatedAt: new Date().toISOString(),
      } as UserProgress;
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.favorites.indexOf(id);
      if (index >= 0) {
        state.favorites.splice(index, 1);
        if (state.progressMap[id]) {
          state.progressMap[id].isFavorite = false;
        }
      } else {
        state.favorites.unshift(id);
        if (state.progressMap[id]) {
          state.progressMap[id].isFavorite = true;
        }
      }
    },
    setWatchStatus: (
      state,
      action: PayloadAction<{ contentId: string; status: WatchStatus; userId: string }>
    ) => {
      const { contentId, status, userId } = action.payload;
      if (!state.progressMap[contentId]) {
        state.progressMap[contentId] = {
          userId,
          contentId,
          watchStatus: status,
          isFavorite: false,
          updatedAt: new Date().toISOString(),
        };
      } else {
        state.progressMap[contentId].watchStatus = status;
      }
    },
    addToHistory: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.history = [id, ...state.history.filter(h => h !== id)].slice(0, 50);
    },
    clearUserData: state => {
      state.progressMap = {};
      state.favorites = [];
      state.history = [];
    },
  },
});

export const {
  updateProgress,
  toggleFavorite,
  setWatchStatus,
  addToHistory,
  clearUserData,
} = userSlice.actions;
export default userSlice.reducer;