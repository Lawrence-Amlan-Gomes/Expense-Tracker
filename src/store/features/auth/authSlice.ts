// src/store/features/auth/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IBank {
  name: string;
  amount: number;
}

export interface ISpending {
  date: string;
  item: string;
  cost: number;
}

export interface IMonth {
  name: string;
  spendings: ISpending[];
}

export interface IMoney {
  banks: IBank[];
  inCash: number;
  Months: IMonth[];
}

export interface IIncome {
  year: number;
  month: string;
  amount: number;
}

export interface CleanUser {
  id: string;
  name: string;
  email: string;
  photo: string;
  firstTimeLogin: boolean;
  isAdmin: boolean;
  createdAt: string;
  expiredAt: string;
  paymentType: string;
  isEmailVerified: boolean;
  money: IMoney;
  income: IIncome[];
}

export interface CleanGoogleUser {
  name: string;
  email: string;
  image: string;
}

interface AuthState {
  user: CleanUser | null;
  googleUser: CleanGoogleUser | null;
}

function loadFromLocalStorage(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, googleUser: null };
  }
  try {
    const user = localStorage.getItem("authUser");
    const googleUser = localStorage.getItem("authGoogleUser");
    return {
      user: user ? (JSON.parse(user) as CleanUser) : null,
      googleUser: googleUser ? (JSON.parse(googleUser) as CleanGoogleUser) : null,
    };
  } catch {
    return { user: null, googleUser: null };
  }
}

const initialState: AuthState = loadFromLocalStorage();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<CleanUser | null>) => {
      state.user = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) {
          localStorage.setItem("authUser", JSON.stringify(action.payload));
        } else {
          localStorage.removeItem("authUser");
        }
      }
    },
    setGoogleAuth: (state, action: PayloadAction<CleanGoogleUser | null>) => {
      state.googleUser = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) {
          localStorage.setItem("authGoogleUser", JSON.stringify(action.payload));
        } else {
          localStorage.removeItem("authGoogleUser");
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.googleUser = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("authUser");
        localStorage.removeItem("authToken");
        localStorage.removeItem("authGoogleUser");
      }
    },
  },
});

export const { setAuth, setGoogleAuth, logout } = authSlice.actions;
export default authSlice.reducer;