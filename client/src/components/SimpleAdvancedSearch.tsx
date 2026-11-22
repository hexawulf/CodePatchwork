import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdvancedSearchProps {
  selectedLanguages?: string[] | null;
  selectedTags?: string[] | null;
  favoritesOnly?: boolean;
  onSearchChange: (search: string) => void;
  onLanguageChange: (languages: string[] | null) => void;
  onTagChange: (tags: string[] | null) => void;
  onFavoriteFilter: (favoritesOnly: boolean) => void;
  className?: string;
  refetch?: () => void;
}

export default function SimpleAdvancedSearch({
  selectedLanguages = null,
  selectedTags = null,
  favoritesOnly = false,
  onSearchChange,
  onLanguageChange,
  onTagChange,
  onFavoriteFilter,
  className = "",
  refetch,
}: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: languages = [] } = useQuery<string[]>({
    queryKey: ["/api/languages"],
  });

  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/tags"],
  });

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    clearTimer();
    timerRef.current = setTimeout(() => onSearchChange(value), 300);
  };

  const toggleItem = (
    current: string[] | null,
    item: string,
    checked: boolean,
    onChange: (next: string[] | null) => void,
  ) => {
    const list = current ?? [];
    const next = checked ? Array.from(new Set([...list, item])) : list.filter((v) => v !== item);
    onChange(next.length > 0 ? next : null);
  };

  const selectedLangSet = new Set(selectedLanguages ?? []);
  const selectedTagSet = new Set(selectedTags ?? []);

  return (
    <div className={`flex flex-col md:flex-row gap-2 ${className}`}>
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
        <Input
          type="search"
          placeholder="Search snippets..."
          className="pl-9 bg-white dark:bg-slate-800"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              clearTimer();
              onSearchChange(searchTerm);
              refetch?.();
            }
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 bg-white dark:bg-slate-800">
              Languages
              {selectedLangSet.size > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0.5">
                  {selectedLangSet.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Programming Languages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((lang) => (
              <DropdownMenuCheckboxItem
                key={lang}
                checked={selectedLangSet.has(lang)}
                onCheckedChange={(checked) =>
                  toggleItem(selectedLanguages, lang, Boolean(checked), onLanguageChange)
                }
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 bg-white dark:bg-slate-800">
              Tags
              {selectedTagSet.size > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0.5">
                  {selectedTagSet.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Topic Tags</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={selectedTagSet.has(tag)}
                onCheckedChange={(checked) =>
                  toggleItem(selectedTags, tag, Boolean(checked), onTagChange)
                }
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-md border border-input h-10">
          <Checkbox
            id="favorites"
            checked={favoritesOnly}
            onCheckedChange={(checked) => onFavoriteFilter(Boolean(checked))}
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
