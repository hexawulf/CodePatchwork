import { createContext, useContext, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Collection, type InsertCollection, type Snippet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CollectionContextType {
  // Collection modal state
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  isEditModalOpen: boolean;
  openEditModal: (collection: Collection) => void;
  closeEditModal: () => void;
  collectionToEdit: Collection | null;
  
  // Collection operations
  createCollection: (collection: InsertCollection) => Promise<void>;
  updateCollection: (id: number, collection: InsertCollection) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  
  // Collection item operations
  addSnippetToCollection: (collectionId: number, snippetId: number) => Promise<void>;
  removeSnippetFromCollection: (collectionId: number, snippetId: number) => Promise<void>;
  
  // Active collection
  activeCollectionId: number | null;
  setActiveCollectionId: (id: number | null) => void;
  activeCollectionSnippets: Snippet[];
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all collections
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    retry: 1
  });
  
  // Fetch snippets for active collection
  const { data: activeCollectionSnippets = [] } = useQuery<Snippet[]>({
    queryKey: ["/api/collections", activeCollectionId, "snippets"],
    enabled: activeCollectionId !== null,
    retry: 1
  });
  
  // Create collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: async (collection: InsertCollection) => {
      await apiRequest("POST", "/api/collections", collection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Collection created",
        description: "Your collection has been created successfully."
      });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating collection",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update collection mutation
  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, collection }: { id: number; collection: InsertCollection }) => {
      await apiRequest("PUT", `/api/collections/${id}`, collection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Collection updated",
        description: "Your collection has been updated successfully."
      });
      setIsEditModalOpen(false);
      setCollectionToEdit(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating collection",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      if (activeCollectionId !== null) {
        setActiveCollectionId(null);
      }
      toast({
        title: "Collection deleted",
        description: "Your collection has been deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting collection",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Add snippet to collection mutation
  const addSnippetToCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, snippetId }: { collectionId: number; snippetId: number }) => {
      await apiRequest("POST", `/api/collections/${collectionId}/snippets/${snippetId}`, {});
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/collections", variables.collectionId, "snippets"] 
      });
      toast({
        title: "Snippet added",
        description: "The snippet has been added to the collection."
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding snippet",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Remove snippet from collection mutation
  const removeSnippetFromCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, snippetId }: { collectionId: number; snippetId: number }) => {
      await apiRequest("DELETE", `/api/collections/${collectionId}/snippets/${snippetId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/collections", variables.collectionId, "snippets"] 
      });
      toast({
        title: "Snippet removed",
        description: "The snippet has been removed from the collection."
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing snippet",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);
  
  const openEditModal = (collection: Collection) => {
    setCollectionToEdit(collection);
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCollectionToEdit(null);
  };
  
  const createCollection = async (collection: InsertCollection) => {
    await createCollectionMutation.mutateAsync(collection);
  };
  
  const updateCollection = async (id: number, collection: InsertCollection) => {
    await updateCollectionMutation.mutateAsync({ id, collection });
  };
  
  const deleteCollection = async (id: number) => {
    await deleteCollectionMutation.mutateAsync(id);
  };
  
  const addSnippetToCollection = async (collectionId: number, snippetId: number) => {
    await addSnippetToCollectionMutation.mutateAsync({ collectionId, snippetId });
  };
  
  const removeSnippetFromCollection = async (collectionId: number, snippetId: number) => {
    await removeSnippetFromCollectionMutation.mutateAsync({ collectionId, snippetId });
  };
  
  const value = {
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    collectionToEdit,
    createCollection,
    updateCollection,
    deleteCollection,
    addSnippetToCollection,
    removeSnippetFromCollection,
    activeCollectionId,
    setActiveCollectionId,
    activeCollectionSnippets
  };
  
  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollectionContext() {
  const context = useContext(CollectionContext);
  
  if (context === undefined) {
    throw new Error("useCollectionContext must be used within a CollectionProvider");
  }
  
  return context;
}