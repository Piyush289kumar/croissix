// mobile_app\features\user\services\user.api.ts

import { API } from "@/lib/axiosClient";
import { User } from "@/types/user";

export const fetchUserProfile = async (): Promise<User> => {
  const token = localStorage.getItem("accessToken");

  const res = await API.get("/users/profile/view", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.user;
};
