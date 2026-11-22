import type { Snippet } from "@shared/schema";
import type { SortOrder } from "./constants";

export function sortSnippets(snippets: readonly Snippet[], sortOrder: SortOrder | string): Snippet[] {
  return [...snippets].sort((a, b) => {
    switch (sortOrder) {
      case "recent":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "oldest":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case "views":
        return (b.viewCount || 0) - (a.viewCount || 0);
      case "az":
        return a.title.localeCompare(b.title);
      case "za":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });
}
