import Layout from "@/components/Layout";
import SnippetGrid from "@/components/SnippetGrid";
import AddSnippetDialog from "@/components/AddSnippetDialog";
import { useState } from "react";
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

export default function Snippets() {
  // Local state for filtering and display
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<string>("recent");
  
  const { snippets, isLoading, error } = useSnippets({
    search: searchTerm,
    language: activeLanguage,
    tag: activeTag
  });
  
  // Sort snippets based on selected order
  const sortedSnippets = [...(snippets || [])].sort((a, b) => {
    switch (sortOrder) {
      case "recent":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "oldest":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case "views":
        return (b.viewCount || 0) - (a.viewCount || 0);
      case "az":
        return a.title.localeCompare(b.title);
      case "za":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  return (
    <Layout>
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Snippets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and organize your code snippets
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Select 
            value={sortOrder} 
            onValueChange={(value) => setSortOrder(value)}
          >
            <SelectTrigger className="h-9 w-[160px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="views">Most Used</SelectItem>
              <SelectItem value="az">A-Z</SelectItem>
              <SelectItem value="za">Z-A</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "secondary" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-9 w-9"
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-9 w-9"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
          
          <AddSnippetDialog />
        </div>
      </div>
      
      {/* Main content */}
      <SnippetGrid 
        snippets={sortedSnippets} 
        isLoading={isLoading} 
        error={error}
        viewMode={viewMode}
      />
      

    </Layout>
  );
}