import { API } from "@/lib/axiosClient";
import { TestimonialApiResponse, TestimonialQuery } from "@/types/testimonial";

export const fetchTestimonials = async (
  params: TestimonialQuery = {},
): Promise<TestimonialApiResponse> => {
  const res = await API.get("/testimonial/public", { params });
  return res.data;
};
