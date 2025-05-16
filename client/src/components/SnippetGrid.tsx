import { type Snippet } from "@shared/schema";
import SnippetCard from "./SnippetCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SnippetGridProps {
  snippets: Snippet[];
  isLoading: boolean;
  error: Error | null;
  viewMode: "grid" | "list";
}

export default function SnippetGrid({ snippets, isLoading, error, viewMode }: SnippetGridProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load snippets: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${viewMode === "list" ? "!grid-cols-1" : ""}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm p-4">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No snippets found</h3>
        <p className="text-slate-500 dark:text-slate-400">
          Try adjusting your search or filters, or create a new snippet.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${viewMode === "list" ? "!grid-cols-1" : ""}`}>
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} viewMode={viewMode} />
      ))}
    </div>
  );
}
