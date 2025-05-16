import { useState } from "react";
import { type Snippet } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Star, Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CodeBlock from "./CodeBlock";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface SnippetCardProps {
  snippet: Snippet;
  viewMode: "grid" | "list";
}

export default function SnippetCard({ snippet, viewMode }: SnippetCardProps) {
  // Temporarily use direct functions instead of context
  const openEditModal = (snippet: Snippet) => {
    console.log("Edit modal opened for snippet:", snippet.id);
  };
  
  const toggleFavorite = async (id: number) => {
    console.log("Toggle favorite for snippet:", id);
    return Promise.resolve();
  };
  
  const deleteSnippet = async (id: number) => {
    console.log("Delete snippet:", id);
    return Promise.resolve();
  };
  const { toast } = useToast();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Function to get language color
  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: "#F7DF1E",
      typescript: "#3178C6",
      python: "#3572A5",
      java: "#B07219",
      go: "#00ADD8",
      css: "#563D7C",
      html: "#E34F26",
      jsx: "#61DAFB",
      tsx: "#61DAFB",
      sql: "#e38c00",
      bash: "#4EAA25",
    };
    
    return colors[language.toLowerCase()] || "#718096";
  };
  
  // Function to copy code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet.code);
    toast({
      title: "Code copied!",
      description: "The code snippet has been copied to your clipboard.",
    });
  };
  
  // Function to handle favorite toggle
  const handleFavoriteToggle = async () => {
    await toggleFavorite(snippet.id);
  };
  
  // Function to handle edit
  const handleEdit = () => {
    openEditModal(snippet);
  };
  
  // Function to handle delete
  const handleDelete = async () => {
    try {
      await deleteSnippet(snippet.id);
      toast({
        title: "Snippet deleted",
        description: "The snippet has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the snippet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200",
      viewMode === "list" && "flex flex-col md:flex-row"
    )}>
      <div className={cn(
        "p-4 pb-3",
        viewMode === "list" && "md:w-1/3"
      )}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-slate-900 dark:text-white">{snippet.title}</h3>
          <div className="flex space-x-1">
            <button 
              type="button" 
              onClick={handleFavoriteToggle}
              className={cn(
                snippet.isFavorite 
                  ? "text-amber-400 hover:text-amber-500" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
              aria-label={snippet.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className="h-5 w-5" fill={snippet.isFavorite ? "currentColor" : "none"} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button" 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label="More options"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {snippet.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{snippet.description}</p>
        )}
        
        <div className="mb-3 flex flex-wrap gap-1">
          <span 
            className="text-xs py-0.5 px-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
          >
            {snippet.language}
          </span>
          
          {snippet.tags && snippet.tags.map(tag => (
            <span 
              key={tag} 
              className="text-xs py-0.5 px-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className={cn(
          "relative text-sm rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden",
          viewMode === "list" && "md:hidden"
        )}>
          <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 rounded-bl text-xs px-2 py-0.5 flex items-center">
            <span 
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: getLanguageColor(snippet.language) }}
            ></span>
            <span className="text-slate-700 dark:text-slate-300">{snippet.language}</span>
            <button 
              className="ml-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" 
              aria-label="Copy code"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-6 max-h-48 overflow-y-auto">
            <CodeBlock code={snippet.code} language={snippet.language} />
          </div>
        </div>
      </div>
      
      {viewMode === "list" && (
        <div className="hidden md:block md:w-2/3 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 rounded-bl text-xs px-2 py-0.5 flex items-center">
            <button 
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" 
              aria-label="Copy code"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-6 max-h-48 overflow-y-auto">
            <CodeBlock code={snippet.code} language={snippet.language} />
          </div>
        </div>
      )}
      
      <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center">
        <span>
          Updated {formatDistanceToNow(new Date(snippet.updatedAt), { addSuffix: true })}
        </span>
        <span>{snippet.viewCount} uses</span>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the snippet "{snippet.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
