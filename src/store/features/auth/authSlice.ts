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

const initialState: AuthState = {
  user: null,
  googleUser: null,
};

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