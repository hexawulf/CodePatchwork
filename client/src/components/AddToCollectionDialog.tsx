import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Collection, Snippet } from "@shared/schema";
import { FolderPlus, Check, Loader2 } from "lucide-react";
import { useCollectionContext } from "@/contexts/CollectionContext";
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
  snippet,
}: AddToCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { addSnippetToCollection } = useCollectionContext();

  const { data: collections = [], isLoading } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: open,
    retry: 1,
  });

  const handleSelectCollection = (id: number) => {
    setSelectedCollectionId(id === selectedCollectionId ? null : id);
  };

  const handleAddToCollection = async () => {
    if (!selectedCollectionId) return;

    setIsAdding(true);
    try {
      await addSnippetToCollection(selectedCollectionId, snippet.id);
      onOpenChange(false);
    } catch {
      // Error toast is already handled by CollectionContext mutation
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>Select a collection to add this snippet to.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-6">
            <FolderPlus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-foreground font-medium mb-1">No collections yet</p>
            <p className="text-muted-foreground text-sm">
              Create a collection first to add snippets to it.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] overflow-y-auto pr-3">
            <div className="space-y-2 py-2">
              {collections.map((collection) => (
                <button
                  type="button"
                  key={collection.id}
                  className={`w-full text-left border rounded-md p-3 cursor-pointer transition-colors ${
                    selectedCollectionId === collection.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  }`}
                  onClick={() => handleSelectCollection(collection.id)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{collection.name}</p>
                      {collection.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    {selectedCollectionId === collection.id && (
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddToCollection} disabled={!selectedCollectionId || isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to Collection"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
