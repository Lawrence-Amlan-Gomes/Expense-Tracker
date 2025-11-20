// src/app/hooks/useResponse.ts
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  setMyText,
  setAiResponse,
  setToday,
  setClickedDate,
  setInputOutputPair,
  clearInputOutputPairs,
} from '@/store/features/response/responseSlice';

export const useResponse = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    myText,
    aiResponse,
    inputOutputPair,
    today,
    clickedDate,
    generationLimit,
  } = useSelector((state: RootState) => state.response);

  return {
    myText,
    aiResponse,
    inputOutputPair,
    today,
    clickedDate,
    generationLimit,
    dispatch, // Expose dispatch for direct use

    setMyText: (text: string) => dispatch(setMyText(text)),
    setAiResponse: (text: string) => dispatch(setAiResponse(text)),
    setToday: (date: string) => dispatch(setToday(date)),
    setClickedDate: (date: string) => dispatch(setClickedDate(date)),
    setInputOutputPair: (pairs: [string, string][]) =>
      dispatch(setInputOutputPair(pairs)),

  };
};