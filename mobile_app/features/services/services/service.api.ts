// website\app\features\services\services\service.api.ts

import { API } from "@/lib/axiosClient";
import { Service } from "@/types/service";

export interface ServiceQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filter?: string;
  domains?: string[];
}

export interface ServiceResponse {
  data: Service[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Fetch Service List - Public
export const fetchPublicServices = async (
  params: ServiceQuery = {},
): Promise<ServiceResponse> => {
  const res = await API.get("/service/public", {
    params: {
      ...params,
      domains: params.domains?.join(","),
    },
  });
  return res.data;
};


// Fetch Service Name List - Public
export const fetchPublicServicesNames = async (
  params: ServiceQuery = {},
): Promise<ServiceResponse> => {
  const res = await API.get("/service/public/names", {
    params: {
      ...params,
      domains: params.domains?.join(","),
    },
  });
  return res.data;
};


// Fetch Service By ID - Public 
export const fetchServiceById = async (id: string): Promise<Service> => {
  const res = await API.get(`/service/public/${id}`);
  return res.data.data;
};