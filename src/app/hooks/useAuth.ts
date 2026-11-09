// src/app/hooks/useAuth.ts
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { setAuth, setGoogleAuth } from '@/store/features/auth/authSlice';
import type { CleanUser, CleanGoogleUser } from '@/store/features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => 
    state.auth.user
  ) as CleanUser | null;

  const googleUser = useSelector((state: RootState) => 
    state.auth.googleUser
  ) as CleanGoogleUser | null;

  return {
    user,
    googleUser,

    setAuth: (payload: CleanUser | null) => 
      dispatch(setAuth(payload)),

    setGoogleAuth: (payload: CleanGoogleUser | null) => 
      dispatch(setGoogleAuth(payload)),
  };
};