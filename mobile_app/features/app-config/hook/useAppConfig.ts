// mobile_app\features\app-config\hook\useAppConfig.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { setAppConfig } from "@/redux/slices/appConfigSlice";
import { AppConfig } from "@/types/app-config";
import { fetchPublicAppConfig } from "@/features/app-config/services/appConfig.api";

export const useAppConfig = () => {
  const dispatch = useDispatch();

  const queryResult = useQuery<AppConfig>({
    queryKey: ["app-config"],
    queryFn: fetchPublicAppConfig,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (queryResult.data) {
      dispatch(setAppConfig(queryResult.data));
    }
  }, [queryResult.data, dispatch]);

  return queryResult;
};
