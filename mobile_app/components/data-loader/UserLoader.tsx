// mobile_app\components\data-loader\UserLoader.tsx

"use client";

import { useUser } from "@/features/user/hook/useUser";

export default function UserLoader() {
  useUser(); // loads user + stores in redux
  return null;
}