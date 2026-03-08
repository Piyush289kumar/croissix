// mobile_app\features\auth\hook\useAuth.ts

"use client";

import { useMutation } from "@tanstack/react-query";
import { loginUser, registerUser } from "../services/auth.api";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slices/userSlice";

export const useRegister = () => {
  return useMutation({
    mutationFn: registerUser,
  });
};

export const useLogin = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: loginUser,

    onSuccess: (data) => {
      if (!data?.token) return;

      // 🔥 Clean previous session
      localStorage.removeItem("accessToken");
      localStorage.removeItem("lastExternalReferrer");
      localStorage.removeItem("lastExternalReferrerTime");
      localStorage.removeItem("topicsLastReferenceTime");

      // store fresh token
      localStorage.setItem("accessToken", data.token);

      // store user in redux
      if (data.user) {
        dispatch(setUser(data.user));
      }
    },
  });
};