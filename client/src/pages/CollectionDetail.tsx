import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { useCollectionContext } from "@/contexts/CollectionContext";
import { useToast } from "@/hooks/use-toast";
import SnippetGrid from "@/components/SnippetGrid";
import type { Collection, Snippet } from "@shared/schema";

export default function CollectionDetail() {
  const [, params] = useRoute<{ id: string }>("/collections/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const parsedId = params ? Number.parseInt(params.id, 10) : Number.NaN;
  const collectionId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;

  const { setActiveCollectionId, removeSnippetFromCollection } = useCollectionContext();

  useEffect(() => {
    if (collectionId !== null) setActiveCollectionId(collectionId);
    return () => setActiveCollectionId(null);
  }, [collectionId, setActiveCollectionId]);

  const {
    data: collection,
    isLoading: isLoadingCollection,
    error: collectionError,
  } = useQuery<Collection>({
    queryKey: ["/api/collections", collectionId],
    enabled: collectionId !== null,
    retry: 1,
  });

  const {
    data: snippets = [],
    isLoading: isLoadingSnippets,
    error: snippetsError,
  } = useQuery<Snippet[]>({
    queryKey: ["/api/collections", collectionId, "snippets"],
    enabled: collectionId !== null,
    retry: 1,
  });

  const handleExportCollection = () => {
    if (!collection || snippets.length === 0) return;
    const payload = snippets.map((s) => ({
      title: s.title,
      description: s.description,
      code: s.code,
      language: s.language,
      tags: s.tags ?? [],
      isFavorite: s.isFavorite === true,
      isPublic: s.isPublic === true,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const slug = collection.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "collection";
    link.download = `codepatchwork-${slug}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast({
      title: "Collection exported",
      description: `${snippets.length} snippets saved as JSON.`,
    });
  };

  if (isLoadingCollection || isLoadingSnippets) {
    return (
      <Layout>
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/collections")}>
            <ArrowLeft className="h-4 w-4" />
            Collections
          </Button>
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        </div>
        <SnippetGrid snippets={[]} isLoading={true} error={null} viewMode="grid" />
      </Layout>
    );
  }

  if (collectionError || snippetsError) {
    return (
      <Layout>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-destructive">
          <h2 className="font-semibold">Error loading collection</h2>
          <p className="mt-1 text-sm">{collectionError?.message || snippetsError?.message}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/collections")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1 gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/collections")}
          >
            <ArrowLeft className="h-4 w-4" />
            Collections
          </Button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {collection?.name || "Collection"}
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {snippets.length}
            </span>
          </div>
          {collection?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
          )}
        </div>

        {snippets.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportCollection} className="gap-1.5 self-start sm:self-auto">
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
        )}
      </div>

      {snippets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-10 text-center">
          <h3 className="mb-1 text-base font-semibold text-foreground">No snippets in this collection</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Open any snippet from your library and toggle this collection in the inspector drawer.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            Browse Library
          </Button>
        </div>
      ) : (
        <SnippetGrid
          snippets={snippets}
          isLoading={false}
          error={null}
          viewMode="grid"
          onRemoveFromCollection={
            collectionId !== null
              ? (snippetId) => removeSnippetFromCollection(collectionId, snippetId)
              : undefined
          }
        />
      )}
    </Layout>
  );
}
