import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Snippet } from "@shared/schema";

export type VisibilityFilter = "all" | "public" | "private";

interface UseSnippetsOptions {
  search?: string;
  languages?: string[] | null;
  tags?: string[] | null;
  favoritesOnly?: boolean;
  visibility?: VisibilityFilter;
  enabled?: boolean;
}

export function useSnippets({
  search,
  languages,
  tags,
  favoritesOnly,
  visibility = "all",
  enabled = true,
}: UseSnippetsOptions = {}) {
  const queryParams = new URLSearchParams();

  if (search) queryParams.append("search", search);
  languages?.forEach((lang) => queryParams.append("language", lang));
  tags?.forEach((tag) => queryParams.append("tag", tag));
  if (favoritesOnly) queryParams.append("favorites", "true");
  if (visibility === "public" || visibility === "private") {
    queryParams.append("visibility", visibility);
  }

  const queryString = queryParams.toString();
  const queryUrl = queryString ? `/api/snippets?${queryString}` : "/api/snippets";

  const { data, isLoading, isFetching, error, refetch } = useQuery<Snippet[]>({
    queryKey: [queryUrl],
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  return {
    snippets: data ?? [],
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
