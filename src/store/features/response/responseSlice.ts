// src/store/features/response/responseSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GenerationLimit {
  free: number;
  standard: number;
  premium: number;
}

export interface ResponseState {
  myText: string;
  aiResponse: string;
  inputOutputPair: [string, string][];
  today: string;
  clickedDate: string;
  generationLimit: GenerationLimit;
}

const initialState: ResponseState = {
  myText: "",
  aiResponse: "",
  inputOutputPair: [],
  today: "",
  clickedDate: "",
  generationLimit: { free: 3, standard: 9, premium: 19 },
};

const responseSlice = createSlice({
  name: "response",
  initialState,
  reducers: {
    setMyText: (state, action: PayloadAction<string>) => {
      state.myText = action.payload;
    },
    setAiResponse: (state, action: PayloadAction<string>) => {
      state.aiResponse = action.payload;
    },
    setToday: (state, action: PayloadAction<string>) => {
      state.today = action.payload;
    },
    setClickedDate: (state, action: PayloadAction<string>) => {
      state.clickedDate = action.payload;
    },

    // NEW: replace the entire inputOutputPair array
    setInputOutputPair: (state, action: PayloadAction<[string, string][]>) => {
      state.inputOutputPair = action.payload;
    },

    clearInputOutputPairs: (state) => {
      state.inputOutputPair = [];
    },
  },
});

export const {
  setMyText,
  setAiResponse,
  setToday,
  setClickedDate,
  setInputOutputPair,
  clearInputOutputPairs,
} = responseSlice.actions;

export default responseSlice.reducer;
