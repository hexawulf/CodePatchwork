import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Collection } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Pencil, Trash2, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Collections() {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  // Fetch collections
  const { data: collections = [], isLoading, error } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    retry: 1
  });

  // Handle open create collection modal
  const handleOpenCreateModal = () => {
    console.log("Open create collection modal");
  };

  // Handle edit collection
  const handleEditCollection = (collection: Collection) => {
    console.log("Edit collection", collection);
  };

  // Handle delete collection
  const handleDeleteCollection = (collection: Collection) => {
    setCollectionToDelete(collection);
    setShowDeleteDialog(true);
  };

  // Confirm delete collection
  const confirmDeleteCollection = async () => {
    if (!collectionToDelete) return;
    
    try {
      console.log("Delete collection", collectionToDelete.id);
      // Would call a delete API here in full implementation
      toast({
        title: "Collection deleted",
        description: "The collection has been deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setCollectionToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Collections</h1>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 animate-pulse"
            >
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-400">Error loading collections</h2>
          <p className="text-red-700 dark:text-red-300 mt-1">{error.message}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Collections</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize your snippets into collections
          </p>
        </div>
        <Button 
          onClick={handleOpenCreateModal}
          className="mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No collections yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Create your first collection to organize your code snippets
          </p>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <div 
              key={collection.id}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {collection.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        type="button" 
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditCollection(collection)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCollection(collection)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {collection.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
                    {collection.description}
                  </p>
                )}
                
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Created {formatDistanceToNow(new Date(collection.createdAt), { addSuffix: true })}
                </div>
              </div>
              
              <div 
                className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm text-primary-600 dark:text-primary-400 font-normal"
                  onClick={() => console.log(`View snippets in collection ${collection.id}`)}
                >
                  View snippets
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the collection 
              {collectionToDelete ? ` "${collectionToDelete.name}"` : ""} 
              and remove all snippets from it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCollection}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}