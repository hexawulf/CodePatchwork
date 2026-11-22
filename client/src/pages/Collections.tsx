import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import type { CollectionWithCount } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Pencil, Trash2, MoreVertical, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCollectionContext } from "@/contexts/CollectionContext";
import CollectionDialog from "@/components/CollectionDialog";
import { useQuery } from "@tanstack/react-query";

export default function Collections() {
  const [collectionToDelete, setCollectionToDelete] = useState<CollectionWithCount | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<CollectionWithCount | null>(null);
  const [, navigate] = useLocation();

  const { deleteCollection, setActiveCollectionId } = useCollectionContext();

  const { data: collections = [], isLoading, error } = useQuery<CollectionWithCount[]>({
    queryKey: ["/api/collections"],
    retry: 1,
  });

  const confirmDeleteCollection = async () => {
    if (!collectionToDelete) return;
    try {
      await deleteCollection(collectionToDelete.id);
    } finally {
      setCollectionToDelete(null);
    }
  };

  const handleViewSnippets = (collectionId: number) => {
    setActiveCollectionId(collectionId);
    navigate(`/collections/${collectionId}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Collections</h1>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Collection
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
              <div className="mb-4 h-4 w-1/2 rounded bg-muted" />
              <div className="h-3 w-1/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <h2 className="font-semibold">Error loading collections</h2>
          <p className="mt-1 text-sm">{error.message}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Collections</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Group related snippets into focused sets.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-foreground">No collections yet</h3>
          <p className="mb-5 text-sm text-muted-foreground">
            Create your first collection to group snippets by project or topic.
          </p>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewSnippets(collection.id)}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                      {collection.name}
                    </h3>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setCollectionToEdit(collection)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCollectionToDelete(collection)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {collection.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {collection.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                    {collection.snippetCount ?? 0}{" "}
                    {(collection.snippetCount ?? 0) === 1 ? "snippet" : "snippets"}
                  </span>
                  <span>·</span>
                  <span>
                    Created {formatDistanceToNow(new Date(collection.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleViewSnippets(collection.id)}
                className="flex items-center justify-between border-t border-border/70 bg-muted/30 px-5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-primary transition-colors"
              >
                <span>Open collection</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {collectionToDelete && (
        <AlertDialog
          open={Boolean(collectionToDelete)}
          onOpenChange={(open) => {
            if (!open) setCollectionToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete collection?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{collectionToDelete.name}&rdquo;. Your snippets
                themselves will not be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCollection}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showCreateDialog && (
        <CollectionDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      )}

      {collectionToEdit && (
        <CollectionDialog
          open={Boolean(collectionToEdit)}
          onOpenChange={(open) => {
            if (!open) setCollectionToEdit(null);
          }}
          collectionToEdit={collectionToEdit}
          isEditMode={true}
        />
      )}
    </Layout>
  );
}
