// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import themeReducer from "./features/theme/themeSlice";
import priceReducer from "./features/price/priceSlice"
import responseReducer from "./features/response/responseSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    price: priceReducer,
    response: responseReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;