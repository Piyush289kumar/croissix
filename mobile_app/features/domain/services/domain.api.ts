// website\app\features\domain\services\domain.api.ts

import { API } from "@/lib/axiosClient";
import { Domain, DomainApiResponse } from "@/types/domain";

// Fetch all public domains
export const fetchPublicDomains = async (): Promise<DomainApiResponse> => {
  const res = await API.get("/domains/public");
  return res.data;
};

// Fetch single public domain by ID
export const fetchPublicDomainById = async (id: string): Promise<Domain> => {
  const res = await API.get(`/domains/public/${id}`);
  return res.data.data;
};