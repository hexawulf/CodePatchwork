import { createContext, useContext, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, invalidateSnippetQueries } from "@/lib/queryClient";
import type { Snippet, InsertSnippet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface SnippetContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeLanguage: string | null;
  setActiveLanguage: (language: string | null) => void;
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
  createSnippet: (snippet: InsertSnippet) => Promise<void>;
  updateSnippet: (id: number, snippet: Omit<InsertSnippet, "userId">) => Promise<void>;
  deleteSnippet: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
}

const SnippetContext = createContext<SnippetContextType | undefined>(undefined);

export function SnippetProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSnippetMutation = useMutation({
    mutationFn: async (snippet: InsertSnippet) => {
      await apiRequest("POST", "/api/snippets", snippet);
    },
    onSuccess: () => {
      invalidateSnippetQueries(queryClient);
      toast({
        title: "Snippet created",
        description: "Your code snippet has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating snippet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSnippetMutation = useMutation({
    mutationFn: async ({ id, snippet }: { id: number; snippet: Omit<InsertSnippet, "userId"> }) => {
      await apiRequest("PUT", `/api/snippets/${id}`, snippet);
    },
    onSuccess: () => {
      invalidateSnippetQueries(queryClient);
      toast({
        title: "Snippet updated",
        description: "Your code snippet has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating snippet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/snippets/${id}`, undefined, { expectJson: false });
    },
    onSuccess: () => {
      invalidateSnippetQueries(queryClient);
      toast({
        title: "Snippet deleted",
        description: "Your code snippet has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting snippet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/snippets/${id}/favorite`);
    },
    onSuccess: () => {
      invalidateSnippetQueries(queryClient);
    },
    onError: (error) => {
      toast({
        title: "Error updating favorite status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <SnippetContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        activeLanguage,
        setActiveLanguage,
        activeTag,
        setActiveTag,
        createSnippet: async (snippet) => {
          await createSnippetMutation.mutateAsync(snippet);
        },
        updateSnippet: async (id, snippet) => {
          await updateSnippetMutation.mutateAsync({ id, snippet });
        },
        deleteSnippet: async (id) => {
          await deleteSnippetMutation.mutateAsync(id);
        },
        toggleFavorite: async (id) => {
          await toggleFavoriteMutation.mutateAsync(id);
        },
      }}
    >
      {children}
    </SnippetContext.Provider>
  );
}

export function useSnippetContext() {
  const context = useContext(SnippetContext);
  if (context === undefined) {
    throw new Error("useSnippetContext must be used within a SnippetProvider");
  }
  return context;
}

export type { Snippet };
