import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCollectionSchema, type Collection } from "@shared/schema";
import { useCollectionContext } from "@/contexts/CollectionContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Extend the schema with client-side validation
const collectionFormSchema = insertCollectionSchema.extend({
  name: z.string().min(1, "Name is required").max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(200, "Description cannot exceed 200 characters").optional(),
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

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
  isEditMode = false
}: CollectionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCollection, updateCollection } = useCollectionContext();
  
  // Initialize form with default values or edit values
  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: collectionToEdit?.name || "",
      description: collectionToEdit?.description || "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: CollectionFormValues) => {
    console.log('🚀 COLLECTION FORM SUBMIT:', values);
    console.log('🚀 AUTH STATUS CHECK - About to create collection');
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && collectionToEdit) {
        console.log('🚀 CALLING updateCollection with:', values);
        await updateCollection(collectionToEdit.id, values);
      } else {
        console.log('🚀 CALLING createCollection with:', values);
        await createCollection(values);
      }
      
      console.log('🚀 COLLECTION OPERATION SUCCESS');
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("🚀 ERROR in onSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Collection" : "Create Collection"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update your collection details below."
              : "Create a new collection to organize your code snippets."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Collection name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this collection"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : isEditMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
