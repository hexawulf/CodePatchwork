import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Collection, Snippet } from "@shared/schema";
import { FolderPlus, Check, Loader2 } from "lucide-react";
import { useCollectionContext } from "@/contexts/CollectionContext";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snippet: Snippet;
}

export default function AddToCollectionDialog({
  open,
  onOpenChange,
  snippet
}: AddToCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { addSnippetToCollection } = useCollectionContext();
  const { toast } = useToast();
  
  // Fetch collections
  const { data: collections = [], isLoading } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    retry: 1
  });
  
  // Handle select collection
  const handleSelectCollection = (id: number) => {
    setSelectedCollectionId(id === selectedCollectionId ? null : id);
  };
  
  // Handle add to collection
  const handleAddToCollection = async () => {
    if (!selectedCollectionId) return;
    
    setIsAdding(true);
    
    try {
      await addSnippetToCollection(selectedCollectionId, snippet.id);
      toast({
        title: "Snippet added",
        description: `Added "${snippet.title}" to the collection.`
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add snippet to collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Select a collection to add this snippet to.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-6">
            <FolderPlus className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">No collections yet</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Create a collection first to add snippets to it.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] overflow-y-auto pr-3">
            <div className="space-y-2 py-2">
              {collections.map(collection => (
                <div 
                  key={collection.id}
                  className={`
                    border rounded-md p-3 cursor-pointer transition-colors
                    ${selectedCollectionId === collection.id 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }
                  `}
                  onClick={() => handleSelectCollection(collection.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {collection.name}
                      </p>
                      {collection.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    {selectedCollectionId === collection.id && (
                      <Check className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToCollection}
            disabled={!selectedCollectionId || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to Collection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}