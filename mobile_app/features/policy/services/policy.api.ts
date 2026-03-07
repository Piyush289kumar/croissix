import { API } from "@/lib/axiosClient";
import { Policy, PolicyApiResponse, PolicyQuery } from "@/types/policy";

// Featch all active policies (PUBLIC)
export const fetchPublicPolicies = async (
  params: PolicyQuery = {},
): Promise<PolicyApiResponse> => {
  const res = await API.get("/policy/public", { params });
  return res.data;
};

// Fetch active policy by ID (PUBLIC)
export const fetchPublicPolicyById = async (id: string): Promise<Policy> => {
  const res = await API.get(`/policy/public/${id}`);
  return res.data.data;
};
