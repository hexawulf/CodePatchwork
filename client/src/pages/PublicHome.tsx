import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import SnippetGrid from "@/components/SnippetGrid";
import FilterBadges from "@/components/FilterBadges";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Snippet } from "@shared/schema";
import Layout from "@/components/Layout";

const ALL_ITEMS_VALUE = "_ALL_";

export default function PublicHome() {
  const { signIn } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(ALL_ITEMS_VALUE);
  const [selectedTag, setSelectedTag] = useState(ALL_ITEMS_VALUE);

  const { data: allSnippets = [], isLoading, error } = useQuery<Snippet[]>({
    queryKey: ["/api/public/snippets"],
    retry: 1,
  });

  const { availableLanguages, availableTags } = useMemo(() => {
    const langs = new Set<string>();
    const tags = new Set<string>();
    for (const snippet of allSnippets) {
      if (snippet.language?.trim()) langs.add(snippet.language);
      snippet.tags?.forEach((t) => t?.trim() && tags.add(t));
    }
    return {
      availableLanguages: [ALL_ITEMS_VALUE, ...Array.from(langs).sort()],
      availableTags: [ALL_ITEMS_VALUE, ...Array.from(tags).sort()],
    };
  }, [allSnippets]);

  const filteredSnippets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allSnippets.filter((snippet) => {
      if (q) {
        const matchTitle = snippet.title.toLowerCase().includes(q);
        const matchDesc = snippet.description?.toLowerCase().includes(q) ?? false;
        const matchCode = snippet.code.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCode) return false;
      }
      if (selectedLanguage !== ALL_ITEMS_VALUE && snippet.language !== selectedLanguage) {
        return false;
      }
      if (selectedTag !== ALL_ITEMS_VALUE && !snippet.tags?.includes(selectedTag)) {
        return false;
      }
      return true;
    });
  }, [allSnippets, searchTerm, selectedLanguage, selectedTag]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLanguage(ALL_ITEMS_VALUE);
    setSelectedTag(ALL_ITEMS_VALUE);
  };

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedLanguage !== ALL_ITEMS_VALUE ||
    selectedTag !== ALL_ITEMS_VALUE;

  return (
    <Layout isPublicView={true}>
      <section className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-5 py-6 text-center shadow-sm sm:py-7">
        <div className="mx-auto mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Public Snippet Gallery
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your visual library for reusable code.
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Collect, syntax-highlight, organize into collections, and share clean snippets in seconds.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button size="default" onClick={() => signIn()} className="font-medium">
            Sign in with Google
          </Button>
        </div>
      </section>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search public snippets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger aria-label="Filter by language">
            <SelectValue placeholder="All Languages" />
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang === ALL_ITEMS_VALUE ? "All Languages" : lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger aria-label="Filter by tag">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag === ALL_ITEMS_VALUE ? "All Tags" : `#${tag}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && !error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <FilterBadges
            searchTerm={searchTerm}
            languages={selectedLanguage !== ALL_ITEMS_VALUE ? [selectedLanguage] : null}
            tags={selectedTag !== ALL_ITEMS_VALUE ? [selectedTag] : null}
            favoritesOnly={false}
            onClearSearch={() => setSearchTerm("")}
            onRemoveLanguage={() => setSelectedLanguage(ALL_ITEMS_VALUE)}
            onRemoveTag={() => setSelectedTag(ALL_ITEMS_VALUE)}
            onRemoveFavorites={() => undefined}
            onClearAll={clearFilters}
          />
          <span className="ml-auto text-xs font-medium text-muted-foreground">
            {hasActiveFilters
              ? `Showing ${filteredSnippets.length} of ${allSnippets.length} public snippets`
              : `${allSnippets.length} public ${allSnippets.length === 1 ? "snippet" : "snippets"}`}
          </span>
        </div>
      )}

      <SnippetGrid
        snippets={filteredSnippets}
        isLoading={isLoading}
        error={error}
        viewMode="grid"
        isPublicView={true}
        onSelectLanguage={(lang) =>
          setSelectedLanguage((cur) => (cur === lang ? ALL_ITEMS_VALUE : lang))
        }
        onSelectTag={(tag) => setSelectedTag((cur) => (cur === tag ? ALL_ITEMS_VALUE : tag))}
      />
    </Layout>
  );
}
