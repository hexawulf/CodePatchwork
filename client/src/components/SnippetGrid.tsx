import type { Snippet } from "@shared/schema";
import SnippetCard from "./SnippetCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Code2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSnippetContext } from "@/contexts/SnippetContext";

interface SnippetGridProps {
  snippets: Snippet[];
  isLoading: boolean;
  error: Error | null;
  viewMode: "grid" | "list";
  isPublicView?: boolean;
  onRemoveFromCollection?: (snippetId: number) => void;
  onSelectLanguage?: (language: string) => void;
  onSelectTag?: (tag: string) => void;
}

function formatErrorMessage(error: Error): string {
  const raw = error.message || "Unexpected error";
  const match = raw.match(/^\d+:\s*(\{[\s\S]*\})$/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as { message?: unknown };
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      // Fall back to raw message
    }
  }
  return raw;
}

export default function SnippetGrid({
  snippets,
  isLoading,
  error,
  viewMode,
  isPublicView = false,
  onRemoveFromCollection,
  onSelectLanguage,
  onSelectTag,
}: SnippetGridProps) {
  const { openCreateEditor } = useSnippetContext();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load snippets</AlertTitle>
        <AlertDescription>{formatErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  const gridClass =
    viewMode === "list"
      ? "grid grid-cols-1 gap-3.5"
      : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4";

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="mb-3 h-3.5 w-3/4" />
            <div className="mb-3 flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Code2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {isPublicView ? "No public snippets found" : "No matching snippets"}
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground mb-5">
          {isPublicView
            ? "Try adjusting your search or language filter."
            : "Clear your active filters or save your first reusable code snippet."}
        </p>
        {!isPublicView && (
          <Button size="sm" onClick={openCreateEditor} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Snippet
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {snippets.map((snippet) => (
        <SnippetCard
          key={snippet.id}
          snippet={snippet}
          viewMode={viewMode}
          isPublicView={isPublicView}
          onRemoveFromCollection={onRemoveFromCollection}
          onSelectLanguage={onSelectLanguage}
          onSelectTag={onSelectTag}
        />
      ))}
    </div>
  );
}
