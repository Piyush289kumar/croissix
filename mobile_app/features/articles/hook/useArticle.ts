// website\app\features\articles\hook\useArticle.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArticleQuery,
  ArticleResponse,
  fetchArticleById,
  fetchPublicArticles,
} from "../services/article.api";
import { Article } from "@/types/article";

export const usePublicArticles = (query: ArticleQuery = {}) => {
  return useQuery<ArticleResponse>({
    queryKey: ["public-articles", query],
    queryFn: () => fetchPublicArticles(query),
    staleTime: 1000 * 60 * 5, // 5 min
  });
};

export const useArticleById = (id: string) => {
  return useQuery<Article>({
    queryKey: ["article", id],
    queryFn: () => fetchArticleById(id),
    staleTime: 1000 * 60 * 5,
  });
};