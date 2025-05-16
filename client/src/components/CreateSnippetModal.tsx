import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSnippetSchema } from "@shared/schema";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import CodeBlock from "./CodeBlock";
import { LANGUAGES } from "@/lib/constants";

// Extend the snippet schema with validation
const snippetFormSchema = insertSnippetSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  code: z.string().min(1, "Code content is required"),
  tags: z.array(z.string()).optional().nullable(),
});

type SnippetFormValues = z.infer<typeof snippetFormSchema>;

export default function CreateSnippetModal() {
  const { closeCreateModal, createSnippet, snippetToEdit, isEditModalOpen, closeEditModal, updateSnippet } = useSnippetContext();
  const [selectedLanguage, setSelectedLanguage] = useState(snippetToEdit?.language || "javascript");
  
  // Initialize form with default values or snippet to edit
  const form = useForm<SnippetFormValues>({
    resolver: zodResolver(snippetFormSchema),
    defaultValues: {
      title: snippetToEdit?.title || "",
      description: snippetToEdit?.description || "",
      code: snippetToEdit?.code || "",
      language: snippetToEdit?.language || "javascript",
      tags: snippetToEdit?.tags || [],
      userId: null,
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;
  
  // Handle form submission
  const onSubmit = async (values: SnippetFormValues) => {
    try {
      if (isEditModalOpen && snippetToEdit) {
        await updateSnippet(snippetToEdit.id, values);
        closeEditModal();
      } else {
        await createSnippet(values);
        closeCreateModal();
      }
    } catch (error) {
      console.error("Error saving snippet:", error);
    }
  };
  
  // Close the modal
  const handleClose = () => {
    if (isEditModalOpen) {
      closeEditModal();
    } else {
      closeCreateModal();
    }
  };
  
  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value.trim();
    
    if ((e.key === 'Enter' || e.key === ',') && value) {
      e.preventDefault();
      
      // Get current tags
      const currentTags = form.getValues("tags") || [];
      
      // Add new tag if it doesn't already exist
      if (!currentTags.includes(value)) {
        form.setValue("tags", [...currentTags, value]);
        input.value = '';
      }
    }
  };
  
  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags", 
      currentTags.filter(tag => tag !== tagToRemove)
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditModalOpen ? "Edit Snippet" : "Create New Snippet"}
          </h2>
          <button 
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-7rem)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Name your snippet" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Briefly describe your snippet" 
                        className="resize-none" 
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Supports markdown formatting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedLanguage(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <div>
                          <Input 
                            placeholder="Add tags, press Enter or comma to add" 
                            onKeyDown={handleTagInput}
                          />
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {form.watch("tags")?.map(tag => (
                              <div 
                                key={tag} 
                                className="flex items-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded px-2 py-1 text-xs"
                              >
                                <span>{tag}</span>
                                <button 
                                  type="button" 
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Separate tags with commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <div className="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden">
                      <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {selectedLanguage}
                        </span>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Textarea 
                            className="font-mono text-sm p-3 min-h-32 bg-slate-50 dark:bg-slate-800 border-0 focus-visible:ring-0 resize-none"
                            placeholder="Paste or type your code here"
                            {...field}
                          />
                        </FormControl>
                        
                        {field.value && (
                          <div className="absolute inset-0 opacity-0 pointer-events-none">
                            <CodeBlock code={field.value} language={selectedLanguage} />
                          </div>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : (isEditModalOpen ? "Update Snippet" : "Save Snippet")}
          </Button>
        </div>
      </div>
    </div>
  );
}
