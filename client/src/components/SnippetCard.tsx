import { useState } from "react";
import { type Snippet } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Star, Copy, MoreVertical, Pencil, Trash2, FolderPlus, Share2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CodeBlock from "./CodeBlock";
import { useSnippetContext } from "@/contexts/SnippetContext";
import AddSnippetDialog from "./AddSnippetDialog";
import AddToCollectionDialog from "./AddToCollectionDialog";
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
  // Use the context for all operations
  const { toggleFavorite, deleteSnippet } = useSnippetContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isTogglePublic, setIsTogglePublic] = useState(false);
  
  // Function to get language color
  const getLanguageColor = (language?: string) => {
    if (!language) return "#718096"; // Default color if language is undefined or null
    
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
  
  // States for copy feedback
  const [isCopying, setIsCopying] = useState(false);
  
  // Function to copy code to clipboard
  const copyToClipboard = async () => {
    try {
      setIsCopying(true);
      const codeToCopy = snippet.code || "";
      await navigator.clipboard.writeText(codeToCopy);
      toast({
        title: "Code copied!",
        description: "The code snippet has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Try again or use the edit mode to select and copy manually.",
        variant: "destructive",
      });
    } finally {
      // Show brief visual feedback
      setTimeout(() => setIsCopying(false), 1000);
    }
  };
  
  // Function to handle favorite toggle
  const handleFavoriteToggle = async () => {
    await toggleFavorite(snippet.id);
  };
  
  // Function to handle edit
  const handleEdit = () => {
    setIsEditDialogOpen(true);
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
  
  // Function to handle sharing
  const handleShare = async () => {
    try {
      setIsSharing(true);
      const response = await apiRequest<{shareId: string}>(`/api/snippets/${snippet.id}/share`, {
        method: 'POST'
      }) as {shareId: string};
      
      if (response.shareId) {
        const shareUrl = `${window.location.origin}/shared/${response.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Share link created!",
          description: "The share link has been copied to your clipboard.",
        });
        
        // Invalidate cache to refresh snippet with new shareId
        queryClient.invalidateQueries({ queryKey: ['/api/snippets'] });
      }
    } catch (error) {
      toast({
        title: "Sharing failed",
        description: "Could not create a share link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  // Function to toggle public access
  const handleTogglePublic = async () => {
    try {
      setIsTogglePublic(true);
      const updatedSnippet = await apiRequest<Snippet>(`/api/snippets/${snippet.id}/publish`, {
        method: 'POST'
      }) as Snippet;
      
      toast({
        title: updatedSnippet.isPublic ? "Snippet published" : "Snippet unpublished",
        description: updatedSnippet.isPublic 
          ? "Anyone with the link can now view this snippet." 
          : "This snippet is now private.",
      });
      
      // Invalidate cache to refresh snippet with updated isPublic status
      queryClient.invalidateQueries({ queryKey: ['/api/snippets'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update visibility. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglePublic(false);
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
                <DropdownMenuItem onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy code
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare} disabled={isSharing}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {isSharing ? "Creating share link..." : "Share"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTogglePublic} disabled={isTogglePublic}>
                  <Globe className="h-4 w-4 mr-2" />
                  {isTogglePublic 
                    ? "Updating..." 
                    : snippet.isPublic 
                      ? "Make private" 
                      : "Make public"
                  }
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCollectionDialogOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Add to collection
                </DropdownMenuItem>
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
          {snippet.language && (
            <span 
              className="text-xs py-0.5 px-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
            >
              {snippet.language}
            </span>
          )}
          
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
            {snippet.language ? (
              <>
                <span 
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: getLanguageColor(snippet.language) }}
                ></span>
                <span className="text-slate-700 dark:text-slate-300">{snippet.language}</span>
              </>
            ) : (
              <span className="text-slate-700 dark:text-slate-300">text</span>
            )}
            <button 
              className={`ml-2 ${isCopying ? 'text-green-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              aria-label="Copy code"
              onClick={copyToClipboard}
              disabled={isCopying}
            >
              <Copy className={`h-4 w-4 ${isCopying ? 'animate-ping' : ''}`} />
            </button>
          </div>
          
          <div className="mt-6 max-h-48 overflow-y-auto">
            <CodeBlock 
              code={snippet.code || ""} 
              language={snippet.language || "text"} 
            />
          </div>
        </div>
      </div>
      
      {viewMode === "list" && (
        <div className="hidden md:block md:w-2/3 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 rounded-bl text-xs px-2 py-0.5 flex items-center">
            <button 
              className={`${isCopying ? 'text-green-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              aria-label="Copy code"
              onClick={copyToClipboard}
              disabled={isCopying}
            >
              <Copy className={`h-4 w-4 ${isCopying ? 'animate-ping' : ''}`} />
            </button>
          </div>
          
          <div className="mt-6 max-h-48 overflow-y-auto">
            <CodeBlock 
              code={snippet.code || ""} 
              language={snippet.language || "text"} 
            />
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

      {/* Edit Snippet Dialog */}
      <AddSnippetDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        snippetToEdit={snippet}
        isEditMode={true}
      />
      
      {/* Add to Collection Dialog */}
      <AddToCollectionDialog
        open={isCollectionDialogOpen}
        onOpenChange={setIsCollectionDialogOpen}
        snippet={snippet}
      />
    </div>
  );
}