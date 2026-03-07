// mobile_app\features\auth\services\auth.api.ts

import { API } from "@/lib/axiosClient";

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterPayload) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (data: LoginPayload) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};