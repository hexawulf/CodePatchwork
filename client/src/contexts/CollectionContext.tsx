import { createContext, useContext, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertCollection } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export type CollectionInput = Pick<InsertCollection, "name" | "description">;

interface CollectionContextType {
  createCollection: (collection: CollectionInput) => Promise<void>;
  updateCollection: (id: number, collection: CollectionInput) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  addSnippetToCollection: (collectionId: number, snippetId: number) => Promise<void>;
  removeSnippetFromCollection: (collectionId: number, snippetId: number) => Promise<void>;
  activeCollectionId: number | null;
  setActiveCollectionId: (id: number | null) => void;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCollectionMutation = useMutation({
    mutationFn: async (collection: CollectionInput) => {
      await apiRequest("POST", "/api/collections", collection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Collection created",
        description: "Your collection has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating collection",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, collection }: { id: number; collection: CollectionInput }) => {
      await apiRequest("PUT", `/api/collections/${id}`, collection);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections", variables.id] });
      toast({
        title: "Collection updated",
        description: "Your collection has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating collection",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/collections/${id}`, undefined, { expectJson: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      if (activeCollectionId !== null) {
        setActiveCollectionId(null);
      }
      toast({
        title: "Collection deleted",
        description: "Your collection has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting collection",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addSnippetToCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, snippetId }: { collectionId: number; snippetId: number }) => {
      await apiRequest("POST", `/api/collections/${collectionId}/snippets/${snippetId}`, {});
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/collections", variables.collectionId, "snippets"],
      });
      toast({
        title: "Snippet added",
        description: "The snippet has been added to the collection.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding snippet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeSnippetFromCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, snippetId }: { collectionId: number; snippetId: number }) => {
      await apiRequest("DELETE", `/api/collections/${collectionId}/snippets/${snippetId}`, undefined, {
        expectJson: false,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/collections", variables.collectionId, "snippets"],
      });
      toast({
        title: "Snippet removed",
        description: "The snippet has been removed from the collection.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing snippet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <CollectionContext.Provider
      value={{
        createCollection: async (collection) => {
          await createCollectionMutation.mutateAsync(collection);
        },
        updateCollection: async (id, collection) => {
          await updateCollectionMutation.mutateAsync({ id, collection });
        },
        deleteCollection: async (id) => {
          await deleteCollectionMutation.mutateAsync(id);
        },
        addSnippetToCollection: async (collectionId, snippetId) => {
          await addSnippetToCollectionMutation.mutateAsync({ collectionId, snippetId });
        },
        removeSnippetFromCollection: async (collectionId, snippetId) => {
          await removeSnippetFromCollectionMutation.mutateAsync({ collectionId, snippetId });
        },
        activeCollectionId,
        setActiveCollectionId,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollectionContext() {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error("useCollectionContext must be used within a CollectionProvider");
  }
  return context;
}
