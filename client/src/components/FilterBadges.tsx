import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilterBadgesProps {
  languages: string[] | null;
  tags: string[] | null;
  favoritesOnly: boolean;
  onRemoveLanguage: (language: string) => void;
  onRemoveTag: (tag: string) => void;
  onRemoveFavorites: () => void;
  onClearAll: () => void;
  className?: string;
}

export default function FilterBadges({
  languages,
  tags,
  favoritesOnly,
  onRemoveLanguage,
  onRemoveTag,
  onRemoveFavorites,
  onClearAll,
  className = "",
}: FilterBadgesProps) {
  // Count total active filters
  const totalFilters = 
    (languages?.length || 0) + 
    (tags?.length || 0) + 
    (favoritesOnly ? 1 : 0);
  
  // Don't render anything if no filters are active
  if (totalFilters === 0) return null;
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Languages badges */}
      {languages?.map(language => (
        <Badge 
          key={`lang-${language}`}
          variant="secondary"
          className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50"
        >
          <span>{language}</span>
          <button 
            onClick={() => onRemoveLanguage(language)} 
            className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            aria-label={`Remove ${language} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      {/* Tags badges */}
      {tags?.map(tag => (
        <Badge 
          key={`tag-${tag}`}
          variant="secondary"
          className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <span>{tag}</span>
          <button 
            onClick={() => onRemoveTag(tag)} 
            className="ml-1 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            aria-label={`Remove ${tag} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      {/* Favorites badge */}
      {favoritesOnly && (
        <Badge 
          variant="secondary"
          className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50"
        >
          <span>Favorites</span>
          <button 
            onClick={onRemoveFavorites} 
            className="ml-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
            aria-label="Remove favorites filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      {/* Clear all button - only show if there are multiple filters */}
      {totalFilters > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}