import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SnippetGrid from "@/components/SnippetGrid";
import { useSnippets } from "@/hooks/useSnippets";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { SORT_OPTIONS, type SortOrder } from "@/lib/constants";
import { sortSnippets } from "@/lib/snippets";

export default function Home() {
  const { searchTerm } = useSnippetContext();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  const { snippets, isLoading, error } = useSnippets({ search: searchTerm });
  const sortedSnippets = useMemo(() => sortSnippets(snippets, sortOrder), [snippets, sortOrder]);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Snippets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Collect, organize, and discover code snippets
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

      <SnippetGrid
        snippets={sortedSnippets}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
      />
    </Layout>
  );
}
