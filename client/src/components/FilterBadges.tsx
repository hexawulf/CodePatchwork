import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  className
}: FilterBadgesProps) {
  // Check if any filters are active
  const hasActiveFilters = 
    (languages && languages.length > 0) || 
    (tags && tags.length > 0) || 
    favoritesOnly;
  
  // If no filters are active, don't render the component
  if (!hasActiveFilters) return null;
  
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">
        Active filters:
      </div>
      
      {/* Language badges */}
      {languages && languages.map(language => (
        <Badge 
          key={`lang-${language}`}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          <span className="capitalize">{language}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 w-4 p-0 hover:bg-blue-200 dark:hover:bg-blue-800" 
            onClick={() => onRemoveLanguage(language)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {language} filter</span>
          </Button>
        </Badge>
      ))}
      
      {/* Tag badges */}
      {tags && tags.map(tag => (
        <Badge 
          key={`tag-${tag}`}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          <span>#{tag}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 w-4 p-0 hover:bg-green-200 dark:hover:bg-green-800" 
            onClick={() => onRemoveTag(tag)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {tag} filter</span>
          </Button>
        </Badge>
      ))}
      
      {/* Favorites badge */}
      {favoritesOnly && (
        <Badge 
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
        >
          <span>Favorites only</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 w-4 p-0 hover:bg-amber-200 dark:hover:bg-amber-800" 
            onClick={onRemoveFavorites}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove favorites filter</span>
          </Button>
        </Badge>
      )}
      
      {/* Clear all button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-2"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  );
}