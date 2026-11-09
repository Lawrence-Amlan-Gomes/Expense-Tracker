// src/app/hooks/usePrice.ts
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  setBillingPeriod,
  setSelectedPlan,
  setWantToPayment,
  setFreeTierExpired,
} from '@/store/features/price/priceSlice';

export const usePrice = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    billingPeriod,
    selectedPlan,
    wantToPaymentType,
    wantToPaymentDuration,
    isFreeTierExpired,
  } = useSelector((state: RootState) => state.price);

  return {
    billingPeriod,
    selectedPlan,
    wantToPaymentType,
    wantToPaymentDuration,
    isFreeTierExpired,

    setBillingPeriod: (period: 'monthly' | 'annual') =>
      dispatch(setBillingPeriod(period)),

    setSelectedPlan: (planId: string | null) =>
      dispatch(setSelectedPlan(planId)),

    setWantToPayment: (type: string, duration: string) =>
      dispatch(setWantToPayment({ type, duration })),

    setFreeTierExpired: (expired: boolean) =>
      dispatch(setFreeTierExpired(expired)),
  };
};