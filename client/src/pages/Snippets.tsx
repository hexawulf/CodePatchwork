import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SnippetGrid from "@/components/SnippetGrid";
import SimpleAdvancedSearch from "@/components/SimpleAdvancedSearch";
import FilterBadges from "@/components/FilterBadges";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSnippets } from "@/hooks/useSnippets";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { SORT_OPTIONS, type SortOrder } from "@/lib/constants";
import { sortSnippets } from "@/lib/snippets";

export default function Snippets() {
  const {
    searchTerm,
    activeLanguage,
    setActiveLanguage,
    activeTag,
    setActiveTag,
  } = useSnippetContext();

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || "");
  const [activeLanguages, setActiveLanguages] = useState<string[] | null>(
    activeLanguage ? [activeLanguage] : null,
  );
  const [activeTags, setActiveTags] = useState<string[] | null>(activeTag ? [activeTag] : null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  useEffect(() => {
    setLocalSearchTerm(searchTerm || "");
  }, [searchTerm]);

  useEffect(() => {
    setActiveLanguages(activeLanguage ? [activeLanguage] : null);
  }, [activeLanguage]);

  useEffect(() => {
    setActiveTags(activeTag ? [activeTag] : null);
  }, [activeTag]);

  const { snippets, isLoading, error, refetch } = useSnippets({
    search: localSearchTerm,
    languages: activeLanguages,
    tags: activeTags,
    favoritesOnly,
  });

  const sortedSnippets = useMemo(() => sortSnippets(snippets, sortOrder), [snippets, sortOrder]);

  const handleRemoveLanguage = (language: string) => {
    if (!activeLanguages) return;
    const updated = activeLanguages.filter((lang) => lang !== language);
    setActiveLanguages(updated.length > 0 ? updated : null);
    if (activeLanguage === language) setActiveLanguage(null);
  };

  const handleRemoveTag = (tag: string) => {
    if (!activeTags) return;
    const updated = activeTags.filter((t) => t !== tag);
    setActiveTags(updated.length > 0 ? updated : null);
    if (activeTag === tag) setActiveTag(null);
  };

  const handleClearAllFilters = () => {
    setLocalSearchTerm("");
    setActiveLanguages(null);
    setActiveTags(null);
    setActiveLanguage(null);
    setActiveTag(null);
    setFavoritesOnly(false);
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Snippets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and organize your code snippets
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="h-9 w-[160px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "secondary" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-9 w-9"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-9 w-9"
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <SimpleAdvancedSearch
          selectedLanguages={activeLanguages}
          selectedTags={activeTags}
          favoritesOnly={favoritesOnly}
          onSearchChange={setLocalSearchTerm}
          onLanguageChange={setActiveLanguages}
          onTagChange={setActiveTags}
          onFavoriteFilter={setFavoritesOnly}
          className="mb-2"
          refetch={refetch}
        />

        <FilterBadges
          languages={activeLanguages}
          tags={activeTags}
          favoritesOnly={favoritesOnly}
          onRemoveLanguage={handleRemoveLanguage}
          onRemoveTag={handleRemoveTag}
          onRemoveFavorites={() => setFavoritesOnly(false)}
          onClearAll={handleClearAllFilters}
        />
      </div>

      <SnippetGrid
        snippets={sortedSnippets}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
      />
    </Layout>
  );
}
