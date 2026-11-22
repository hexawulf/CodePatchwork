import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";
import SnippetGrid from "@/components/SnippetGrid";
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
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const { data: allSnippets = [], isLoading, error } = useQuery<Snippet[]>({
    queryKey: ["/api/public/snippets"],
    retry: 1,
  });

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    for (const snippet of allSnippets) {
      if (snippet.language?.trim()) langs.add(snippet.language);
    }
    return [ALL_ITEMS_VALUE, ...Array.from(langs).sort()];
  }, [allSnippets]);

  const filteredSnippets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allSnippets.filter((snippet) => {
      if (q) {
        const matchTitle = snippet.title.toLowerCase().includes(q);
        const matchDesc = snippet.description?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchDesc) return false;
      }
      if (selectedLanguage && selectedLanguage !== ALL_ITEMS_VALUE) {
        if (snippet.language !== selectedLanguage) return false;
      }
      return true;
    });
  }, [allSnippets, searchTerm, selectedLanguage]);

  return (
    <Layout isPublicView={true}>
      <div className="container mx-auto p-4 pt-8">
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
            CodePatchwork
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Discover &amp; Share Code Snippets with the World.
          </p>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => signIn()}
          >
            Sign In / Sign Up
          </Button>
        </header>

        <div className="mb-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Search Snippets
              </label>
              <Input
                id="search"
                type="text"
                placeholder="Search by title, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="language-filter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Language
              </label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger id="language-filter" className="w-full">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem
                      key={lang === ALL_ITEMS_VALUE ? "all-langs-key" : lang}
                      value={lang}
                    >
                      {lang === ALL_ITEMS_VALUE ? "All Languages" : lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <SnippetGrid
          snippets={filteredSnippets}
          isLoading={isLoading}
          error={error}
          viewMode="grid"
          isPublicView={true}
        />
      </div>
    </Layout>
  );
}
