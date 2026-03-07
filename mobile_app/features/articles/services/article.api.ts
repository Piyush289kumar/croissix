// website\app\features\articles\services\article.api.ts

import { API } from "@/lib/axiosClient";
import { Article } from "@/types/article";

export interface ArticleQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filter?: string;
  categories?: string[];
}

export interface ArticleResponse {
  data: Article[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Fetch Article List
export const fetchPublicArticles = async (
  params: ArticleQuery = {},
): Promise<ArticleResponse> => {
  const res = await API.get("/blog", {
    params: {
      ...params,
      categories: params.categories?.join(","),
    },
  });
  return res.data;
};

// Fetch Article By
export const fetchArticleById = async (id: string): Promise<Article> => {
  const res = await API.get(`/blog/${id}`);
  return res.data.data;
};