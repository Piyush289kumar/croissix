// website\app\features\domain\hook\useDomain.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { Domain, DomainApiResponse } from "@/types/domain";
import {
  fetchPublicDomains,
  fetchPublicDomainById,
} from "../services/domain.api";

// Fetch all public domains
export const usePublicDomains = () => {
  return useQuery<DomainApiResponse>({
    queryKey: ["public-domains"],
    queryFn: fetchPublicDomains,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch public domain by ID
export const usePublicDomainById = (id: string) => {
  return useQuery<Domain>({
    queryKey: ["public-domain", id],
    queryFn: () => fetchPublicDomainById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};