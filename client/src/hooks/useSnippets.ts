import { useQuery } from "@tanstack/react-query";
import { Snippet } from "@shared/schema";

interface UseSnippetsOptions {
  search?: string;
  languages?: string[] | null;
  tags?: string[] | null;
  favoritesOnly?: boolean;
}

export function useSnippets({ search, languages, tags, favoritesOnly }: UseSnippetsOptions = {}) {
  // Build query key with filters
  const queryKey = ["/api/snippets"];
  const queryParams = new URLSearchParams();
  
  if (search) {
    queryParams.append("search", search);
  }
  
  // Add multiple languages if provided
  if (languages && languages.length > 0) {
    languages.forEach(lang => {
      queryParams.append("language", lang);
    });
  }
  
  // Add multiple tags if provided
  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      queryParams.append("tag", tag);
    });
  }
  
  // Add favorites filter if enabled
  if (favoritesOnly) {
    queryParams.append("favorites", "true");
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
