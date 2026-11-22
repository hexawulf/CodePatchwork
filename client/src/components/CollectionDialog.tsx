import { useState, useEffect, type FormEvent } from "react";
import type { Collection } from "@shared/schema";
import { useCollectionContext } from "@/contexts/CollectionContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CollectionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  collectionToEdit?: Collection | null;
  isEditMode?: boolean;
}

export default function CollectionDialog({
  open = false,
  onOpenChange,
  collectionToEdit = null,
  isEditMode = false,
}: CollectionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCollection, updateCollection } = useCollectionContext();

  useEffect(() => {
    if (open) {
      setName(isEditMode && collectionToEdit ? collectionToEdit.name : "");
      setDescription(isEditMode && collectionToEdit ? collectionToEdit.description || "" : "");
      setNameError(null);
      setDescError(null);
    }
  }, [open, isEditMode, collectionToEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required");
      return;
    }
    if (trimmedName.length > 50) {
      setNameError("Name cannot exceed 50 characters");
      return;
    }
    if (description.length > 200) {
      setDescError("Description cannot exceed 200 characters");
      return;
    }

    setNameError(null);
    setDescError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || null,
      };
      if (isEditMode && collectionToEdit) {
        await updateCollection(collectionToEdit.id, payload);
      } else {
        await createCollection(payload);
      }
      onOpenChange?.(false);
    } catch (error) {
      console.error("Collection submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Collection" : "Create Collection"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your collection details below."
              : "Create a new collection to organize your code snippets."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              placeholder="Collection name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              maxLength={50}
              required
            />
            {nameError && <p className="text-sm font-medium text-destructive">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-description">Description (optional)</Label>
            <Textarea
              id="collection-description"
              placeholder="Brief description of this collection"
              className="resize-none"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (descError) setDescError(null);
              }}
              maxLength={200}
            />
            {descError && <p className="text-sm font-medium text-destructive">{descError}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : isEditMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
