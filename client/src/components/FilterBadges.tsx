import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VisibilityFilter } from "@/hooks/useSnippets";

interface FilterBadgesProps {
  searchTerm?: string;
  languages: string[] | null;
  tags: string[] | null;
  favoritesOnly: boolean;
  visibility?: VisibilityFilter;
  onClearSearch?: () => void;
  onRemoveLanguage: (language: string) => void;
  onRemoveTag: (tag: string) => void;
  onRemoveFavorites: () => void;
  onClearVisibility?: () => void;
  onClearAll: () => void;
  className?: string;
}

export default function FilterBadges({
  searchTerm,
  languages,
  tags,
  favoritesOnly,
  visibility = "all",
  onClearSearch,
  onRemoveLanguage,
  onRemoveTag,
  onRemoveFavorites,
  onClearVisibility,
  onClearAll,
  className = "",
}: FilterBadgesProps) {
  const hasActiveFilters =
    Boolean(searchTerm?.trim()) ||
    Boolean(languages && languages.length > 0) ||
    Boolean(tags && tags.length > 0) ||
    favoritesOnly ||
    visibility !== "all";

  if (!hasActiveFilters) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-muted-foreground mr-1">Active filters:</span>

      {searchTerm?.trim() && onClearSearch && (
        <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
          <span>&ldquo;{searchTerm.trim()}&rdquo;</span>
          <button type="button" onClick={onClearSearch} aria-label="Clear search">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {languages?.map((language) => (
        <Badge
          key={`lang-${language}`}
          variant="secondary"
          className="gap-1 bg-primary/15 px-2 py-0.5 text-xs text-primary hover:bg-primary/20"
        >
          <span className="capitalize">{language}</span>
          <button
            type="button"
            onClick={() => onRemoveLanguage(language)}
            aria-label={`Remove ${language} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {tags?.map((tag) => (
        <Badge
          key={`tag-${tag}`}
          variant="secondary"
          className="gap-1 px-2 py-0.5 text-xs"
        >
          <span>#{tag}</span>
          <button
            type="button"
            onClick={() => onRemoveTag(tag)}
            aria-label={`Remove ${tag} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {visibility !== "all" && onClearVisibility && (
        <Badge
          variant="secondary"
          className="gap-1 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400"
        >
          <span className="capitalize">{visibility} only</span>
          <button type="button" onClick={onClearVisibility} aria-label="Clear visibility filter">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {favoritesOnly && (
        <Badge
          variant="secondary"
          className="gap-1 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400"
        >
          <span>Favorites</span>
          <button type="button" onClick={onRemoveFavorites} aria-label="Remove favorites filter">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  );
}
