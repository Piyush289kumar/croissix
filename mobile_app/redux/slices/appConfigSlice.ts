// mobile_app\redux\slices\appConfigSlice.ts

import { AppConfig } from "@/types/app-config";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppConfigState {
  data: AppConfig | null;
}

const initialState: AppConfigState = {
  data: null,
};

const appConfigSlice = createSlice({
  name: "appConfig",
  initialState,
  reducers: {
    setAppConfig: (state, action: PayloadAction<AppConfig>) => {
      state.data = action.payload;
    },
  },
});

export const { setAppConfig } = appConfigSlice.actions;
export default appConfigSlice.reducer;
