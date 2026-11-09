// src/store/ReduxProvider.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { ReactNode, useEffect } from 'react';
import { setAuth, setGoogleAuth } from './features/auth/authSlice';

export default function ReduxProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadAuth = async () => {
      const storedUser = localStorage.getItem('authUser');
      const storedToken = localStorage.getItem('authToken');
      const storedGoogleUser = localStorage.getItem('authGoogleUser');

      // ─── 1. Primary: authUser (email or Google) ───────────────────────
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          store.dispatch(setAuth(user));
        } catch {
          localStorage.removeItem('authUser');
        }
      }

      // ─── 2. Fallback: Verify JWT (only if authUser missing) ───────────
      if (!storedUser && storedToken) {
        try {
          const res = await fetch('/api/verify-jwt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: storedToken }),
          });

          if (res.ok) {
            const user = await res.json();
            store.dispatch(setAuth(user));
            localStorage.setItem('authUser', JSON.stringify(user));
          } else {
            localStorage.removeItem('authToken');
          }
        } catch (err) {
          console.error('JWT verification failed:', err);
          localStorage.removeItem('authToken');
        }
      }

      // ─── 3. Google metadata (only after we have a main user) ───────
      if (storedGoogleUser) {
        try {
          const google = JSON.parse(storedGoogleUser);
          store.dispatch(setGoogleAuth(google));
        } catch {
          localStorage.removeItem('authGoogleUser');
        }
      }
    };

    loadAuth();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}