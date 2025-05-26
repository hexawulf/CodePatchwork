// client/src/pages/PublicHome.tsx
import React, { useState, useEffect, useMemo } from 'react';
// Link might be removed if not used elsewhere after this change
import { Link } from 'wouter'; 
import { useAuthContext } from '@/contexts/AuthContext'; // Added
import SnippetGrid from '@/components/SnippetGrid'; // Adjust path as needed
import { Input } from '@/components/ui/input'; // Adjust path for your UI components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Adjust path
import { Button } from '@/components/ui/button'; // Adjust path
import { type Snippet } from '@shared/schema'; // Adjust path
import Layout from '@/components/Layout'; // Adjust path for Layout component

const ALL_ITEMS_VALUE = "_ALL_"; // Define placeholder for "All" options

const PublicHome: React.FC = () => {
  const { signIn } = useAuthContext(); // Added
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [allSnippets, setAllSnippets] = useState<Snippet[]>([]); // Store all fetched snippets for client-side filtering
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Fetch initial public snippets
  useEffect(() => {
    const fetchPublicSnippets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Construct query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedLanguage) params.append('language', selectedLanguage);
        if (selectedTag) params.append('tag', selectedTag);

        // For the initial load and if server-side filtering is fully implemented for all fields,
        // you might fetch with filters directly:
        // const response = await fetch(`/api/public/snippets?${params.toString()}`);
        
        // For now, fetching all and filtering client-side for simplicity in search/filter UI updates
        // until server-side filtering for all params is confirmed.
        // The action plan mentions /api/public/snippets supports query params, so ideally, debounced fetching would be used.
        // Let's assume for now we fetch all public snippets and then apply client-side filtering for dynamic updates.
        const response = await fetch('/api/public/snippets');
        if (!response.ok) {
          throw new Error(`Failed to fetch snippets: ${response.statusText}`);
        }
        const data: Snippet[] = await response.json();
        setAllSnippets(data);
        setSnippets(data); // Initially display all fetched snippets

        // Extract available languages and tags from fetched snippets
        const languages = new Set<string>();
        const tags = new Set<string>();
        data.forEach(snippet => {
          if (snippet.language && snippet.language.trim() !== '') { languages.add(snippet.language); }
          snippet.tags?.forEach(tag => {
            if (tag && tag.trim() !== '') {
              tags.add(tag);
            }
          });
        });
        setAvailableLanguages([ALL_ITEMS_VALUE, ...Array.from(languages)]);
        setAvailableTags([ALL_ITEMS_VALUE, ...Array.from(tags)]);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        console.error("Error fetching public snippets:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicSnippets();
  }, []); // Initial fetch

  // Apply client-side filters when searchTerm, selectedLanguage, or selectedTag changes
  useEffect(() => {
    let filtered = allSnippets;

    if (searchTerm) {
      filtered = filtered.filter(snippet =>
        snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snippet.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLanguage && selectedLanguage !== ALL_ITEMS_VALUE) {
      filtered = filtered.filter(snippet => snippet.language === selectedLanguage);
    }

    if (selectedTag && selectedTag !== ALL_ITEMS_VALUE) {
      filtered = filtered.filter(snippet => snippet.tags?.includes(selectedTag));
    }

    setSnippets(filtered);
  }, [searchTerm, selectedLanguage, selectedTag, allSnippets]);
  
  // Memoize the SnippetGrid to prevent re-renders if snippets haven't changed.
  const memoizedSnippetGrid = useMemo(() => (
    <SnippetGrid
      snippets={snippets}
      isLoading={isLoading}
      error={error ? new Error(error) : null}
      viewMode="grid" // Or your default view mode
      isPublicView={true} // Key prop for SnippetGrid
    />
  ), [snippets, isLoading, error]);


  return (
    <Layout isPublicView={true}>
      <div className="container mx-auto p-4 pt-8">
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
            CodePatchwork
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Discover & Share Code Snippets with the World.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => signIn()} // Call the signIn function from context
          >
            Sign In / Sign Up
          </Button>
        </header>

        <div className="mb-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label htmlFor="language-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger id="language-filter" className="w-full">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map(lang => (
                    <SelectItem 
                      key={lang === ALL_ITEMS_VALUE ? 'all-langs-key' : lang} 
                      value={lang}
                    >
                      {lang === ALL_ITEMS_VALUE ? 'All Languages' : lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Tag filter can be added similarly if desired, for now keeping it simple */}
            {/* <div>
              <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tag
              </label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger id="tag-filter" className="w-full">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map(tag => (
                    <SelectItem 
                      key={tag === ALL_ITEMS_VALUE ? 'all-tags-key' : tag} 
                      value={tag}
                    >
                      {tag === ALL_ITEMS_VALUE ? 'All Tags' : tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
          </div>
        </div>
        
        {memoizedSnippetGrid}

        {/* Empty state message handled by SnippetGrid, but can be enhanced here if needed */}
        {!isLoading && !error && snippets.length === 0 && (
          <div className="text-center mt-10">
            <p className="text-xl text-gray-500 dark:text-gray-400">
              No public snippets found matching your criteria.
            </p>
            {/* Optional: Suggest signing up or contributing */}
          </div>
        )}
        {error && (
           <div className="text-center mt-10">
             <p className="text-xl text-red-500">
               Could not load snippets. Please try again later.
             </p>
           </div>
        )}
      </div>
    </Layout>
  );
};

export default PublicHome;
