import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { authService } from '../../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// ── Email ile giriş ───────────────────────────
export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithEmail(email, password);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ── Google ile giriş ──────────────────────────
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithGoogle();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ── Kayıt ol ──────────────────────────────────
export const register = createAsyncThunk(
  'auth/register',
  async (
    { email, password, username }: { email: string; password: string; username: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authService.register(email, password, username);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: state => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: builder => {
    // loginWithEmail
    builder
      .addCase(loginWithEmail.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // loginWithGoogle
    builder
      .addCase(loginWithGoogle.pending, state => { state.isLoading = true; })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // register
    builder
// register — başarılı olunca giriş yapma, sadece kaydet
.addCase(register.pending, state => {
  state.isLoading = true;
  state.error = null;
})
.addCase(register.fulfilled, state => {
  state.isLoading = false;
  state.isAuthenticated = false;  // otomatik giriş yapma
  state.error = null;
})
.addCase(register.rejected, (state, action) => {
  state.isLoading = false;
  state.error = action.payload as string;
});
  },
});

export const { logout, clearError, updateUser, setAuth, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;