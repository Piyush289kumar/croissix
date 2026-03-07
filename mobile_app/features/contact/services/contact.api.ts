// website\app\features\contact\services\contact.api.ts

import { API } from "@/lib/axiosClient";

export interface ContactPayload {
  type: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  meta?: Record<string, unknown>;
}

export const submitContactForm = async (data: ContactPayload) => {
  const res = await API.post("/contact", data);
  return res.data;
};