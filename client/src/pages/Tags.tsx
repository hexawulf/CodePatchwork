import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tag as TagIcon } from "lucide-react";
import { useSnippets } from "@/hooks/useSnippets";
import SnippetGrid from "@/components/SnippetGrid";
import { stringToColor } from "@/lib/utils";

export default function Tags() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch all tags
  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/tags"],
    retry: 1
  });

  // Fetch snippets filtered by the selected tag
  const { snippets, isLoading, error } = useSnippets({
    tags: activeTag
  });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tags</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse snippets by tags
          </p>
        </div>
      </div>

      {/* Tags Cloud */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-3">All Tags</h2>
        
        {tags.length === 0 ? (
          <div className="text-center py-8">
            <TagIcon className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No tags available</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeTag && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTag(null)}
                className="mb-2"
              >
                Clear filter
              </Button>
            )}
            
            {tags.map(tag => (
              <Button
                key={tag}
                variant={activeTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className="rounded-full"
                style={{
                  backgroundColor: activeTag === tag ? stringToColor(tag) : undefined,
                  borderColor: stringToColor(tag),
                  color: activeTag === tag ? 'white' : stringToColor(tag),
                }}
              >
                {tag}
                {/* Add count if available */}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Content section - show snippets with the selected tag */}
      {activeTag ? (
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
            Snippets tagged with <span className="text-primary-600 dark:text-primary-400">{activeTag}</span>
          </h2>
          <SnippetGrid 
            snippets={snippets} 
            isLoading={isLoading} 
            error={error}
            viewMode={viewMode}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <TagIcon className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Select a tag to view snippets
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Click on any tag above to see all the snippets associated with it
          </p>
        </div>
      )}
    </Layout>
  );
}