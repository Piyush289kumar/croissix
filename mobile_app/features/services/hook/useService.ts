// website\app\features\services\hook\useService.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicServices,
  fetchPublicServicesNames,
  fetchServiceById,
  ServiceQuery,
  ServiceResponse,
} from "../services/service.api";
import { Service } from "@/types/service";

export const usePublicServices = (query: ServiceQuery = {}) => {
  return useQuery<ServiceResponse>({
    queryKey: ["public-services", query],
    queryFn: () => fetchPublicServices(query),
    staleTime: 1000 * 60 * 5, // 5 min
  });
};


export const usePublicServicesNames = () => {
  return useQuery<ServiceResponse>({
    queryKey: ["public-services-names"],
    queryFn: () => fetchPublicServicesNames(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
};


export const useServiceById = (id: string) => {
  return useQuery<Service>({
    queryKey: ["public-service", id],
    queryFn: () => fetchServiceById(id),
    staleTime: 1000 * 60 * 5,
  });
};
