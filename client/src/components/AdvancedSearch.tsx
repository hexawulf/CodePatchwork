import { useState, useEffect } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";

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
  // State for search input
  const [inputValue, setInputValue] = useState("");
  
  // State for active filters
  const [selectedLanguages, setSelectedLanguages] = useState<FilterOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<FilterOption[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  
  // State for filter popover
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Fetch available languages
  const { data: languages = [] } = useQuery<string[]>({
    queryKey: ["/api/languages"],
    retry: 1
  });
  
  // Fetch available tags
  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/tags"],
    retry: 1
  });
  
  // Convert languages to filter options
  useEffect(() => {
    if (languages.length > 0) {
      setSelectedLanguages(
        languages.map(lang => ({
          id: `lang-${lang}`,
          label: lang,
          value: lang,
          selected: false
        }))
      );
    }
  }, [languages]);
  
  // Convert tags to filter options
  useEffect(() => {
    if (tags.length > 0) {
      setSelectedTags(
        tags.map(tag => ({
          id: `tag-${tag}`,
          label: tag,
          value: tag,
          selected: false
        }))
      );
    }
  }, [tags]);
  
  // Handle search input change with debounce
  const handleSearchChange = debounce((value: string) => {
    setInputValue(value);
    onSearchChange(value);
  }, 300);
  
  // Toggle language filter
  const toggleLanguage = (langId: string) => {
    const updatedLanguages = selectedLanguages.map(lang => 
      lang.id === langId ? { ...lang, selected: !lang.selected } : lang
    );
    setSelectedLanguages(updatedLanguages);
    
    const activeLangs = updatedLanguages
      .filter(lang => lang.selected)
      .map(lang => lang.value);
    
    onLanguageChange(activeLangs.length > 0 ? activeLangs : null);
  };
  
  // Toggle tag filter
  const toggleTag = (tagId: string) => {
    const updatedTags = selectedTags.map(tag => 
      tag.id === tagId ? { ...tag, selected: !tag.selected } : tag
    );
    setSelectedTags(updatedTags);
    
    const activeTags = updatedTags
      .filter(tag => tag.selected)
      .map(tag => tag.value);
    
    onTagChange(activeTags.length > 0 ? activeTags : null);
  };
  
  // Toggle favorites only filter
  const toggleFavoritesOnly = (value: boolean) => {
    setFavoritesOnly(value);
    onFavoriteFilter(value);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedLanguages(selectedLanguages.map(lang => ({ ...lang, selected: false })));
    setSelectedTags(selectedTags.map(tag => ({ ...tag, selected: false })));
    setFavoritesOnly(false);
    onLanguageChange(null);
    onTagChange(null);
    onFavoriteFilter(false);
  };
  
  // Count active filters
  const activeFilterCount = 
    selectedLanguages.filter(l => l.selected).length + 
    selectedTags.filter(t => t.selected).length + 
    (favoritesOnly ? 1 : 0);
  
  return (
    <div className={cn("relative flex", className)}>
      {/* Search input */}
      <div className="relative flex-1">
        <input 
          type="text" 
          placeholder="Search snippets..." 
          defaultValue={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full py-2 pl-10 pr-4 border border-slate-300 dark:border-slate-600 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
        <div className="absolute left-3 top-2.5 text-slate-400">
          <Search className="h-5 w-5" />
        </div>
      </div>
      
      {/* Filter button/popover */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="rounded-l-none border-l-0 h-10 relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 bg-primary-500 text-white hover:bg-primary-600"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filter Snippets</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Narrow down snippets by language, tags, and more
              </p>
            </div>
            <Separator />
            
            {/* Languages filter */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Languages</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedLanguages.map(lang => (
                  <div key={lang.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={lang.id} 
                      checked={lang.selected}
                      onCheckedChange={() => toggleLanguage(lang.id)}
                    />
                    <Label 
                      htmlFor={lang.id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {lang.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tags filter */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Tags</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedTags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={tag.id} 
                      checked={tag.selected}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <Label 
                      htmlFor={tag.id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {tag.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Favorites filter */}
            <div className="flex items-center space-x-2">
              <Switch 
                id="favorites-only" 
                checked={favoritesOnly}
                onCheckedChange={toggleFavoritesOnly}
              />
              <Label htmlFor="favorites-only">Favorites only</Label>
            </div>
            
            <Separator />
            
            {/* Filter actions */}
            <div className="flex justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
              >
                Clear filters
              </Button>
              <Button 
                size="sm"
                onClick={() => setIsFilterOpen(false)}
              >
                Apply filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}