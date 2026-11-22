import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tag as TagIcon } from "lucide-react";
import { useSnippets } from "@/hooks/useSnippets";
import SnippetGrid from "@/components/SnippetGrid";
import type { LibraryMeta } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Tags() {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: meta } = useQuery<LibraryMeta>({
    queryKey: ["/api/meta"],
  });

  const tags = meta?.tags ?? [];

  const { snippets, isLoading, error } = useSnippets({
    tags: activeTag ? [activeTag] : null,
    enabled: Boolean(activeTag),
  });

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tags</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Explore every tag across your snippet library.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        {tags.length === 0 ? (
          <div className="py-8 text-center">
            <TagIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No tags yet. Add tags when creating a snippet.</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {activeTag && (
              <Button variant="ghost" size="sm" onClick={() => setActiveTag(null)} className="h-8 text-xs">
                Clear filter
              </Button>
            )}
            {tags.map(({ name, count }) => {
              const selected = activeTag === name;
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => setActiveTag(selected ? null : name)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  <span>#{name}</span>
                  <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeTag ? (
        <div>
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Snippets tagged <span className="text-primary">#{activeTag}</span>
          </h2>
          <SnippetGrid snippets={snippets} isLoading={isLoading} error={error} viewMode="grid" />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-10 text-center">
          <TagIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="mb-1 text-base font-semibold text-foreground">Select a tag</h3>
          <p className="text-sm text-muted-foreground">
            Click any tag above to view matching snippets.
          </p>
        </div>
      )}
    </Layout>
  );
}
