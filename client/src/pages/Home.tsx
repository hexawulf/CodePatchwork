import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SnippetGrid from "@/components/SnippetGrid";
import FilterBadges from "@/components/FilterBadges";
import { useSnippets, type VisibilityFilter } from "@/hooks/useSnippets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, List, Filter, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LibraryMeta } from "@shared/schema";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { SORT_OPTIONS, type SortOrder } from "@/lib/constants";
import { sortSnippets } from "@/lib/snippets";

export default function Home() {
  const {
    searchTerm,
    setSearchTerm,
    selectedLanguages,
    toggleLanguage,
    selectedTags,
    toggleTag,
    favoritesOnly,
    setFavoritesOnly,
    visibility,
    setVisibility,
    clearFilters,
  } = useSnippetContext();
  const { prefs } = usePreferences();

  const [viewMode, setViewMode] = useState<"grid" | "list">(prefs.defaultViewMode);
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  useEffect(() => {
    setViewMode(prefs.defaultViewMode);
  }, [prefs.defaultViewMode]);

  // Single-key g / l shortcuts for Grid / List view
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "g") setViewMode("grid");
      if (e.key === "l") setViewMode("list");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { data: meta } = useQuery<LibraryMeta>({
    queryKey: ["/api/meta"],
  });

  const { snippets, isLoading, isFetching, error } = useSnippets({
    search: searchTerm,
    languages: selectedLanguages.length ? selectedLanguages : null,
    tags: selectedTags.length ? selectedTags : null,
    favoritesOnly,
    visibility,
  });

  const sortedSnippets = useMemo(() => sortSnippets(snippets, sortOrder), [snippets, sortOrder]);

  const heading = favoritesOnly
    ? "Favorites"
    : visibility === "public"
      ? "Public Snippets"
      : visibility === "private"
        ? "Private Snippets"
        : "Snippet Library";

  return (
    <Layout>
      {/* Library Title & Compact Controls */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{heading}</h1>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {sortedSnippets.length}
            </span>
            {isFetching && !isLoading && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" title="Syncing" />
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Click any card to inspect full code, copy Markdown, or manage collections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Languages Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-card">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                Languages
                {selectedLanguages.length > 0 && (
                  <Badge variant="secondary" className="ml-0.5 rounded-full px-1.5 py-0 text-[11px]">
                    {selectedLanguages.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Languages</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(meta?.languages ?? []).length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">No languages yet</div>
              ) : (
                meta!.languages.map(({ name, count }) => (
                  <DropdownMenuCheckboxItem
                    key={name}
                    checked={selectedLanguages.includes(name)}
                    onCheckedChange={() => toggleLanguage(name)}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className="capitalize">{name}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tags Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-card">
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-0.5 rounded-full px-1.5 py-0 text-[11px]">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(meta?.tags ?? []).length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">No tags yet</div>
              ) : (
                meta!.tags.map(({ name, count }) => (
                  <DropdownMenuCheckboxItem
                    key={name}
                    checked={selectedTags.includes(name)}
                    onCheckedChange={() => toggleTag(name)}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span>#{name}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Visibility Filter */}
          <Select value={visibility} onValueChange={(v) => setVisibility(v as VisibilityFilter)}>
            <SelectTrigger className="h-9 w-[125px] bg-card text-xs">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
              <SelectItem value="private">Private Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Favorites toggle */}
          <Button
            variant={favoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className="h-9 gap-1.5"
          >
            <Star className="h-3.5 w-3.5" fill={favoritesOnly ? "currentColor" : "none"} />
            <span className="hidden sm:inline">Favorites</span>
          </Button>

          {/* Sort */}
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="h-9 w-[155px] bg-card text-xs">
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

          {/* Grid / List Toggle */}
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Grid view"
              title="Grid view (G)"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="List view"
              title="List view (L)"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active filter pills */}
      <FilterBadges
        searchTerm={searchTerm}
        languages={selectedLanguages}
        tags={selectedTags}
        favoritesOnly={favoritesOnly}
        visibility={visibility}
        onClearSearch={() => setSearchTerm("")}
        onRemoveLanguage={toggleLanguage}
        onRemoveTag={toggleTag}
        onRemoveFavorites={() => setFavoritesOnly(false)}
        onClearVisibility={() => setVisibility("all")}
        onClearAll={clearFilters}
        className="mb-5"
      />

      <SnippetGrid
        snippets={sortedSnippets}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
      />
    </Layout>
  );
}
