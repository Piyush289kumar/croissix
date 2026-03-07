// mobile_app\features\app-config\services\appConfig.api.ts
import { API } from "@/lib/axiosClient";
import { AppConfig } from "@/types/app-config";

export const fetchPublicAppConfig = async (): Promise<AppConfig> => {
  const res = await API.get("/app-config/public");
  return res.data.data as AppConfig;
};
