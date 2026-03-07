"use client";

import { TestimonialApiResponse, TestimonialQuery } from "@/types/testimonial";
import { useQuery } from "@tanstack/react-query";
import { fetchTestimonials } from "../services/testimonial.api";

export const useTestimonials = (query: TestimonialQuery = {}) => {
  return useQuery<TestimonialApiResponse>({
    queryKey: ["testimonials", query],
    queryFn: () => fetchTestimonials(query),
    staleTime: 1000 * 60 * 5, // 5 Min
  });
};
