import { useQuery } from "@tanstack/react-query";
import type { Snippet } from "@shared/schema";

interface UseSnippetsOptions {
  search?: string;
  languages?: string[] | null;
  tags?: string[] | null;
  favoritesOnly?: boolean;
}

export function useSnippets({ search, languages, tags, favoritesOnly }: UseSnippetsOptions = {}) {
  const queryParams = new URLSearchParams();

  if (search) queryParams.append("search", search);
  languages?.forEach((lang) => queryParams.append("language", lang));
  tags?.forEach((tag) => queryParams.append("tag", tag));
  if (favoritesOnly) queryParams.append("favorites", "true");

  const queryString = queryParams.toString();
  const queryUrl = queryString ? `/api/snippets?${queryString}` : "/api/snippets";

  const { data, isLoading, error, refetch } = useQuery<Snippet[]>({
    queryKey: [queryUrl],
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  return {
    snippets: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
