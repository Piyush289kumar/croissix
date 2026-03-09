// mobile_app\redux\slices\googleSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GoogleStats {
  totalReviews: number;
  repliedReviews: number;
  unrepliedReviews: number;
  avgRating: number;

  totalPosts: number;
  livePosts: number;
  eventPosts: number;
  offerPosts: number;
  updatePosts: number;

  totalImpressions: number;
  totalCalls: number;
  totalWebsite: number;
  totalDirections: number;
}

interface GoogleState {
  stats: GoogleStats | null;
}

const initialState: GoogleState = {
  stats: null,
};

const googleSlice = createSlice({
  name: "google",
  initialState,
  reducers: {
    setGoogleStats: (state, action: PayloadAction<GoogleStats>) => {
      state.stats = action.payload;
    },

    clearGoogleStats: (state) => {
      state.stats = null;
    },
  },
});

export const { setGoogleStats, clearGoogleStats } = googleSlice.actions;

export default googleSlice.reducer;
