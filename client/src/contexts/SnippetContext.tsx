import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, invalidateSnippetQueries } from "@/lib/queryClient";
import type { Snippet, InsertSnippet } from "@shared/schema";
import type { VisibilityFilter } from "@/hooks/useSnippets";
import { useToast } from "@/hooks/use-toast";

interface SnippetContextType {
  // Unified library filter state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedLanguages: string[];
  toggleLanguage: (language: string) => void;
  setSelectedLanguages: (languages: string[]) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  setSelectedTags: (tags: string[]) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (val: boolean) => void;
  visibility: VisibilityFilter;
  setVisibility: (val: VisibilityFilter) => void;
  clearFilters: () => void;

  // Global UI overlays (single instances, zero per-card modal overhead)
  inspectedSnippet: Snippet | null;
  openInspector: (snippet: Snippet) => void;
  closeInspector: () => void;
  editingSnippet: Snippet | null;
  isEditorOpen: boolean;
  openCreateEditor: () => void;
  openEditEditor: (snippet: Snippet) => void;
  closeEditor: () => void;
  isCommandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  isImportExportOpen: boolean;
  setImportExportOpen: (open: boolean) => void;
  isAboutOpen: boolean;
  setAboutOpen: (open: boolean) => void;

  // CRUD & optimistic mutations
  createSnippet: (snippet: InsertSnippet) => Promise<Snippet>;
  updateSnippet: (id: number, snippet: Omit<InsertSnippet, "userId">) => Promise<Snippet>;
  duplicateSnippet: (snippet: Snippet) => Promise<Snippet>;
  deleteSnippet: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  togglePublic: (id: number) => Promise<Snippet>;
}

const SnippetContext = createContext<SnippetContextType | undefined>(undefined);

function isSnippetListKey(key: readonly unknown[]): boolean {
  const first = key[0];
  return (
    typeof first === "string" &&
    (first === "/api/snippets" ||
      first.startsWith("/api/snippets?") ||
      (first === "/api/collections" && key[2] === "snippets"))
  );
}

export function SnippetProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");

  const [inspectedSnippet, setInspectedSnippet] = useState<Snippet | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [isImportExportOpen, setImportExportOpen] = useState(false);
  const [isAboutOpen, setAboutOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleLanguage = useCallback((lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedLanguages([]);
    setSelectedTags([]);
    setFavoritesOnly(false);
    setVisibility("all");
  }, []);

  const patchCachedSnippets = useCallback(
    (updater: (list: Snippet[]) => Snippet[]) => {
      const snapshots: Array<[readonly unknown[], Snippet[] | undefined]> = [];
      for (const query of queryClient.getQueryCache().findAll()) {
        if (!isSnippetListKey(query.queryKey)) continue;
        const prev = queryClient.getQueryData<Snippet[]>(query.queryKey);
        if (Array.isArray(prev)) {
          snapshots.push([query.queryKey, prev]);
          queryClient.setQueryData<Snippet[]>(query.queryKey, updater(prev));
        }
      }
      return snapshots;
    },
    [queryClient],
  );

  const restoreSnapshots = useCallback(
    (snapshots?: Array<[readonly unknown[], Snippet[] | undefined]>) => {
      if (!snapshots) return;
      for (const [key, data] of snapshots) {
        queryClient.setQueryData(key, data);
      }
    },
    [queryClient],
  );

  const createSnippetMutation = useMutation({
    mutationFn: (snippet: InsertSnippet) => apiRequest<Snippet>("POST", "/api/snippets", snippet),
    onSuccess: () => {
      invalidateSnippetQueries(queryClient);
      toast({
        title: "Snippet created",
        description: "Your code snippet has been saved.",
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
    mutationFn: ({ id, snippet }: { id: number; snippet: Omit<InsertSnippet, "userId"> }) =>
      apiRequest<Snippet>("PUT", `/api/snippets/${id}`, snippet),
    onSuccess: (updated) => {
      setInspectedSnippet((cur) => (cur?.id === updated.id ? updated : cur));
      invalidateSnippetQueries(queryClient);
      toast({
        title: "Snippet updated",
        description: "Your changes have been saved.",
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
    mutationFn: (id: number) =>
      apiRequest<void>("DELETE", `/api/snippets/${id}`, undefined, { expectJson: false }),
    onMutate: async (id) => {
      const snapshots = patchCachedSnippets((list) => list.filter((s) => s.id !== id));
      setInspectedSnippet((cur) => (cur?.id === id ? null : cur));
      return { snapshots };
    },
    onSuccess: () => {
      invalidateSnippetQueries(queryClient);
      toast({
        title: "Snippet deleted",
        description: "The snippet has been permanently deleted.",
      });
    },
    onError: (error, _id, ctx) => {
      restoreSnapshots(ctx?.snapshots);
      toast({
        title: "Error deleting snippet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Snippet>("POST", `/api/snippets/${id}/favorite`),
    onMutate: async (id) => {
      const snapshots = patchCachedSnippets((list) =>
        list.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)),
      );
      setInspectedSnippet((cur) => (cur?.id === id ? { ...cur, isFavorite: !cur.isFavorite } : cur));
      return { snapshots };
    },
    onSuccess: (updated) => {
      setInspectedSnippet((cur) => (cur?.id === updated.id ? updated : cur));
      invalidateSnippetQueries(queryClient);
    },
    onError: (error, _id, ctx) => {
      restoreSnapshots(ctx?.snapshots);
      toast({
        title: "Error updating favorite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Snippet>("POST", `/api/snippets/${id}/publish`),
    onMutate: async (id) => {
      const snapshots = patchCachedSnippets((list) =>
        list.map((s) => (s.id === id ? { ...s, isPublic: !s.isPublic } : s)),
      );
      setInspectedSnippet((cur) => (cur?.id === id ? { ...cur, isPublic: !cur.isPublic } : cur));
      return { snapshots };
    },
    onSuccess: (updated) => {
      setInspectedSnippet((cur) => (cur?.id === updated.id ? updated : cur));
      invalidateSnippetQueries(queryClient);
      toast({
        title: updated.isPublic ? "Snippet published" : "Snippet set to private",
        description: updated.isPublic
          ? "Anyone with the share link can now view this snippet."
          : "Only you can view this snippet now.",
      });
    },
    onError: (error, _id, ctx) => {
      restoreSnapshots(ctx?.snapshots);
      toast({
        title: "Error updating visibility",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openCreateEditor = useCallback(() => {
    setEditingSnippet(null);
    setIsEditorOpen(true);
  }, []);

  const openEditEditor = useCallback((snippet: Snippet) => {
    setEditingSnippet(snippet);
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingSnippet(null);
  }, []);

  const duplicateSnippet = useCallback(
    async (snippet: Snippet) => {
      return createSnippetMutation.mutateAsync({
        title: `${snippet.title} (Copy)`,
        code: snippet.code,
        language: snippet.language,
        description: snippet.description ?? null,
        tags: snippet.tags ?? [],
        isFavorite: false,
        isPublic: false,
      });
    },
    [createSnippetMutation],
  );

  return (
    <SnippetContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        selectedLanguages,
        toggleLanguage,
        setSelectedLanguages,
        selectedTags,
        toggleTag,
        setSelectedTags,
        favoritesOnly,
        setFavoritesOnly,
        visibility,
        setVisibility,
        clearFilters,
        inspectedSnippet,
        openInspector: setInspectedSnippet,
        closeInspector: () => setInspectedSnippet(null),
        editingSnippet,
        isEditorOpen,
        openCreateEditor,
        openEditEditor,
        closeEditor,
        isCommandOpen,
        setCommandOpen,
        isImportExportOpen,
        setImportExportOpen,
        isAboutOpen,
        setAboutOpen,
        createSnippet: (snippet) => createSnippetMutation.mutateAsync(snippet),
        updateSnippet: (id, snippet) => updateSnippetMutation.mutateAsync({ id, snippet }),
        duplicateSnippet,
        deleteSnippet: (id) => deleteSnippetMutation.mutateAsync(id),
        toggleFavorite: async (id) => {
          await toggleFavoriteMutation.mutateAsync(id);
        },
        togglePublic: (id) => togglePublicMutation.mutateAsync(id),
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
