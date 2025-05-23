import { createContext, useContext, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Snippet, type InsertSnippet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface SnippetContextType {
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  isEditModalOpen: boolean;
  openEditModal: (snippet: Snippet) => void;
  closeEditModal: () => void;
  snippetToEdit: Snippet | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeLanguage: string | null;
  setActiveLanguage: (language: string | null) => void;
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
  createSnippet: (snippet: InsertSnippet) => Promise<void>;
  updateSnippet: (id: number, snippet: InsertSnippet) => Promise<void>;
  deleteSnippet: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
}

const SnippetContext = createContext<SnippetContextType | undefined>(undefined);

export function SnippetProvider({ children }: { children: ReactNode }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [snippetToEdit, setSnippetToEdit] = useState<Snippet | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch snippets to make available in context
  const { data: snippets = [] } = useQuery<Snippet[]>({
    queryKey: ["/api/snippets"],
    retry: 1
  });

  // Create snippet mutation
  const createSnippetMutation = useMutation({
    mutationFn: async (snippet: InsertSnippet) => {
      await apiRequest("POST", "/api/snippets", snippet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
      toast({
        title: "Snippet created",
        description: "Your code snippet has been created successfully."
      });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating snippet",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update snippet mutation
  const updateSnippetMutation = useMutation({
    mutationFn: async ({ id, snippet }: { id: number; snippet: InsertSnippet }) => {
      await apiRequest("PUT", `/api/snippets/${id}`, snippet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
      toast({
        title: "Snippet updated",
        description: "Your code snippet has been updated successfully."
      });
      setIsEditModalOpen(false);
      setSnippetToEdit(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating snippet",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete snippet mutation
  const deleteSnippetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/snippets/${id}`, undefined, { expectJson: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
      toast({
        title: "Snippet deleted",
        description: "Your code snippet has been deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting snippet",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/snippets/${id}/favorite`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating favorite status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);
  
  const openEditModal = (snippet: Snippet) => {
    setSnippetToEdit(snippet);
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSnippetToEdit(null);
  };

  const createSnippet = async (snippet: InsertSnippet) => {
    await createSnippetMutation.mutateAsync(snippet);
  };

  const updateSnippet = async (id: number, snippet: InsertSnippet) => {
    await updateSnippetMutation.mutateAsync({ id, snippet });
  };

  const deleteSnippet = async (id: number) => {
    await deleteSnippetMutation.mutateAsync(id);
  };

  const toggleFavorite = async (id: number) => {
    await toggleFavoriteMutation.mutateAsync(id);
  };

  const value = {
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    snippetToEdit,
    searchTerm,
    setSearchTerm,
    activeLanguage,
    setActiveLanguage,
    activeTag,
    setActiveTag,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleFavorite
  };

  return <SnippetContext.Provider value={value}>{children}</SnippetContext.Provider>;
}

export function useSnippetContext() {
  const context = useContext(SnippetContext);
  
  if (context === undefined) {
    throw new Error("useSnippetContext must be used within a SnippetProvider");
  }
  
  return context;
}
