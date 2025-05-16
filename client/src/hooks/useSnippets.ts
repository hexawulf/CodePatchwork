import { useQuery } from "@tanstack/react-query";
import { Snippet } from "@shared/schema";

interface UseSnippetsOptions {
  search?: string;
  language?: string | null;
  tag?: string | null;
}

export function useSnippets({ search, language, tag }: UseSnippetsOptions = {}) {
  // Build query key with filters
  const queryKey = ["/api/snippets"];
  const queryParams = new URLSearchParams();
  
  if (search) {
    queryParams.append("search", search);
  }
  
  if (language) {
    queryParams.append("language", language);
  }
  
  if (tag) {
    queryParams.append("tag", tag);
  }
  
  const queryString = queryParams.toString();
  const queryUrl = queryString ? `/api/snippets?${queryString}` : "/api/snippets";
  
  // Fetch snippets with filters
  const { data, isLoading, error } = useQuery<Snippet[]>({
    queryKey: [queryUrl],
    retry: 1
  });
  
  return {
    snippets: data || [],
    isLoading,
    error,
  };
}
