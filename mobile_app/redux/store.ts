// mobile_app/redux/store.ts

import { configureStore } from "@reduxjs/toolkit";
import appConfigReducer from "@/redux/slices/appConfigSlice";
import userReducer from "@/redux/slices/userSlice";
import googleReducer from "@/redux/slices/googleSlice";

export const store = configureStore({
  reducer: {
    // App Configuration State
    appConfig: appConfigReducer,
    // User State
    user: userReducer,
    google: googleReducer,
  },
});

// Types for Redux hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
