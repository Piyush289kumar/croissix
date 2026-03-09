// mobile_app\features\google\hook\useGoogleStats.ts

import { useDispatch } from "react-redux";
import { setGoogleStats } from "@/redux/slices/googleSlice";
import { AppDispatch } from "@/redux/store";

export const useGoogleStats = () => {

  const dispatch = useDispatch<AppDispatch>();

  const loadStats = async (locationId: string) => {

    const token = localStorage.getItem("accessToken");

    const res = await fetch(
      `/api/google/analysis?locationId=${locationId}&range=30d`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const json = await res.json();

    if (json.success) {
      dispatch(setGoogleStats(json.stats));
    }
  };

  return { loadStats };
};