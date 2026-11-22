import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCollectionContext } from "@/contexts/CollectionContext";
import SnippetGrid from "@/components/SnippetGrid";
import type { Collection, Snippet } from "@shared/schema";

export default function CollectionDetail() {
  const [, params] = useRoute<{ id: string }>("/collections/:id");
  const [, navigate] = useLocation();
  const parsedId = params ? Number.parseInt(params.id, 10) : Number.NaN;
  const collectionId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;

  const { setActiveCollectionId } = useCollectionContext();

  useEffect(() => {
    if (collectionId !== null) {
      setActiveCollectionId(collectionId);
    }
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

  if (isLoadingCollection || isLoadingSnippets) {
    return (
      <Layout>
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/collections")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-40 animate-pulse" />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
              >
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (collectionError || snippetsError) {
    return (
      <Layout>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-400">
            Error loading collection
          </h2>
          <p className="text-red-700 dark:text-red-300 mt-1">
            {collectionError?.message || snippetsError?.message}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/collections")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 mr-4"
            onClick={() => navigate("/collections")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {collection?.name || "Collection"}
          </h1>
        </div>

        {collection?.description && (
          <p className="text-slate-500 dark:text-slate-400">{collection.description}</p>
        )}
      </div>

      {snippets.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No snippets in this collection
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Add snippets to this collection from the snippets page
          </p>
          <Button variant="outline" onClick={() => navigate("/snippets")}>
            Go to Snippets
          </Button>
        </div>
      ) : (
        <SnippetGrid snippets={snippets} isLoading={false} error={null} viewMode="grid" />
      )}
    </Layout>
  );
}
