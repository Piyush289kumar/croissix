"use client";

import { Policy, PolicyApiResponse, PolicyQuery } from "@/types/policy";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPolicies, fetchPublicPolicyById } from "../services/policy.api";

// Fetch all public policies
export const usePublicPolicies = (query: PolicyQuery = {}) => {
  return useQuery<PolicyApiResponse>({
    queryKey: ["public-policies", query],
    queryFn: () => fetchPublicPolicies(query),
    staleTime: 1000 * 60 * 5, // 5 Min
  });
};

// Fetch public policy by id
export const usePublicPolicyById = (id:string) => {
  return useQuery<Policy>({
    queryKey: ["public-policy", id],
    queryFn: () => fetchPublicPolicyById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 Min
  });
};



