// mobile_app\features\auth\hook\useAuth.ts

"use client";

import { useMutation } from "@tanstack/react-query";
import { loginUser, registerUser } from "../services/auth.api";

export const useRegister = () => {
  return useMutation({
    mutationFn: registerUser,
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      if (data?.token) {
        localStorage.setItem("accessToken", data.token);
      }
    },
  });
};