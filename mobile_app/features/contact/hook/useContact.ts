// website\app\features\contact\hook\useContact.ts

import { useMutation } from "@tanstack/react-query";
import { submitContactForm } from "../services/contact.api";

/* ------------- PUBLIC SUBMIT HOOK --------------- */

export const useSubmitContactForm = () => {
  return useMutation({
    mutationFn: submitContactForm,
  });
};
