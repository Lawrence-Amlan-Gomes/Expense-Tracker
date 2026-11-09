// src/store/features/price/priceSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PriceState {
  billingPeriod: 'monthly' | 'annual';   // monthly / annual toggle
  selectedPlan: string | null;           // hovered / selected plan id
  wantToPaymentType: string;             // plan title when clicking "Buy"
  wantToPaymentDuration: string;         // monthly | annual for the payment
  isFreeTierExpired: boolean;            // derived from auth.paymentType
}

const initialState: PriceState = {
  billingPeriod: 'monthly',
  selectedPlan: null,
  wantToPaymentType: '',
  wantToPaymentDuration: '',
  isFreeTierExpired: false,
};

const priceSlice = createSlice({
  name: 'price',
  initialState,
  reducers: {
    setBillingPeriod: (state, action: PayloadAction<'monthly' | 'annual'>) => {
      state.billingPeriod = action.payload;
    },
    setSelectedPlan: (state, action: PayloadAction<string | null>) => {
      state.selectedPlan = action.payload;
    },
    setWantToPayment: (
      state,
      action: PayloadAction<{ type: string; duration: string }>
    ) => {
      state.wantToPaymentType = action.payload.type;
      state.wantToPaymentDuration = action.payload.duration;
    },
    setFreeTierExpired: (state, action: PayloadAction<boolean>) => {
      state.isFreeTierExpired = action.payload;
    },
  },
});

export const {
  setBillingPeriod,
  setSelectedPlan,
  setWantToPayment,
  setFreeTierExpired,
} = priceSlice.actions;

export default priceSlice.reducer;