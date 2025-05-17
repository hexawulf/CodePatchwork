import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Create a simple debounce utility inline instead of importing
function useDebounce(fn: Function, delay: number) {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const debouncedFn = React.useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]);
  
  return debouncedFn;
}

// Define filter option type for languages and tags
type FilterOption = {
  id: string;
  label: string;
  value: string;
  selected: boolean;
}

interface AdvancedSearchProps {
  onSearchChange: (search: string) => void;
  onLanguageChange: (languages: string[] | null) => void;
  onTagChange: (tags: string[] | null) => void;
  onFavoriteFilter: (favoritesOnly: boolean) => void;
  className?: string;
}

export default function AdvancedSearch({ 
  onSearchChange, 
  onLanguageChange, 
  onTagChange, 
  onFavoriteFilter,
  className 
}: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [languages, setLanguages] = useState<FilterOption[]>([]);
  const [tags, setTags] = useState<FilterOption[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  
  // Debounce search term changes
  const debouncedSearch = useDebounce((value: string) => {
    onSearchChange(value);
  }, 300);
  
  // Effect to handle search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);
  
  // Effect to fetch available languages
  useEffect(() => {
    async function fetchLanguages() {
      try {
        const response = await fetch('/api/languages');
        if (!response.ok) throw new Error('Failed to fetch languages');
        const data = await response.json();
        
        // Convert to filter options format
        const languageOptions = data.map((lang: string) => ({
          id: lang,
          label: lang.charAt(0).toUpperCase() + lang.slice(1),
          value: lang,
          selected: false
        }));
        
        setLanguages(languageOptions);
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    }
    
    fetchLanguages();
  }, []);
  
  // Effect to fetch available tags
  useEffect(() => {
    async function fetchTags() {
      try {
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Failed to fetch tags');
        const data = await response.json();
        
        // Convert to filter options format
        const tagOptions = data.map((tag: string) => ({
          id: tag,
          label: tag,
          value: tag,
          selected: false
        }));
        
        setTags(tagOptions);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    }
    
    fetchTags();
  }, []);
  
  // Handle language selection changes
  const handleLanguageChange = (languageId: string, isSelected: boolean) => {
    const updatedLanguages = languages.map(lang => 
      lang.id === languageId ? { ...lang, selected: isSelected } : lang
    );
    
    setLanguages(updatedLanguages);
    
    // Pass only selected languages to parent
    const selectedLanguages = updatedLanguages
      .filter(lang => lang.selected)
      .map(lang => lang.value);
    
    onLanguageChange(selectedLanguages.length > 0 ? selectedLanguages : null);
  };
  
  // Handle tag selection changes
  const handleTagChange = (tagId: string, isSelected: boolean) => {
    const updatedTags = tags.map(tag => 
      tag.id === tagId ? { ...tag, selected: isSelected } : tag
    );
    
    setTags(updatedTags);
    
    // Pass only selected tags to parent
    const selectedTags = updatedTags
      .filter(tag => tag.selected)
      .map(tag => tag.value);
    
    onTagChange(selectedTags.length > 0 ? selectedTags : null);
  };
  
  // Handle favorites filter toggle
  const handleFavoritesToggle = (checked: boolean) => {
    setFavoritesOnly(checked);
    onFavoriteFilter(checked);
  };
  
  // Count selected items for badge display
  const selectedLanguagesCount = languages.filter(l => l.selected).length;
  const selectedTagsCount = tags.filter(t => t.selected).length;

  return (
    <div className={`flex flex-col md:flex-row gap-2 ${className}`}>
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
        <Input
          type="search"
          placeholder="Search snippets..."
          className="pl-9 bg-white dark:bg-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Language Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 bg-white dark:bg-slate-800">
              Languages
              {selectedLanguagesCount > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0.5">
                  {selectedLanguagesCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Programming Languages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((lang) => (
              <DropdownMenuCheckboxItem
                key={lang.id}
                checked={lang.selected}
                onCheckedChange={(checked) => handleLanguageChange(lang.id, !!checked)}
              >
                {lang.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Tags Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 bg-white dark:bg-slate-800">
              Tags
              {selectedTagsCount > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0.5">
                  {selectedTagsCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Topic Tags</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag.id}
                checked={tag.selected}
                onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)}
              >
                {tag.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Favorites Toggle */}
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-md border border-input h-10">
          <Checkbox 
            id="favorites" 
            checked={favoritesOnly}
            onCheckedChange={handleFavoritesToggle}
          />
          <label
            htmlFor="favorites"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Favorites only
          </label>
        </div>
      </div>
    </div>
  );
}