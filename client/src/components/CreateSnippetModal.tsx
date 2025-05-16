import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSnippetSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import CodeBlock from "./CodeBlock";
import { LANGUAGES } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

// Extend the snippet schema with validation
const snippetFormSchema = insertSnippetSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  code: z.string().min(1, "Code content is required"),
  tags: z.array(z.string()).optional().nullable(),
});

type SnippetFormValues = z.infer<typeof snippetFormSchema>;

interface CreateSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippetToEdit?: any;
  isEditMode?: boolean;
}

export default function CreateSnippetModal({
  isOpen,
  onClose,
  snippetToEdit = null,
  isEditMode = false
}: CreateSnippetModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState(snippetToEdit?.language || "javascript");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(snippetToEdit?.tags || []);
  
  // Initialize form
  const form = useForm<SnippetFormValues>({
    resolver: zodResolver(snippetFormSchema),
    defaultValues: {
      title: snippetToEdit?.title || "",
      description: snippetToEdit?.description || "",
      code: snippetToEdit?.code || "",
      language: snippetToEdit?.language || "javascript", 
      tags: snippetToEdit?.tags || [],
      userId: null
    }
  });
  
  const isSubmitting = form.formState.isSubmitting;
  
  // Handle form submission
  const onSubmit = async (values: SnippetFormValues) => {
    try {
      if (isEditMode && snippetToEdit) {
        // Update existing snippet
        await apiRequest(`/api/snippets/${snippetToEdit.id}`, 'PATCH', values);
        
        toast({
          title: "Success",
          description: "Snippet updated successfully",
        });
      } else {
        // Create new snippet
        await apiRequest('/api/snippets', 'POST', values);
        
        toast({
          title: "Success",
          description: "Snippet created successfully",
        });
      }
      
      // Invalidate and refetch snippets
      queryClient.invalidateQueries({ queryKey: ['/api/snippets'] });
      
      // Close modal and reset form
      onClose();
      form.reset();
    } catch (error) {
      console.error("Error saving snippet:", error);
      toast({
        title: "Error",
        description: "Failed to save snippet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle adding tags
  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      const newTags = [...selectedTags, tagInput.trim()];
      setSelectedTags(newTags);
      form.setValue('tags', newTags);
      setTagInput("");
    }
  };
  
  // Handle removing tags
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    form.setValue('tags', newTags);
  };
  
  // Handle keyboard events for tags
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  console.log("CreateSnippetModal - isOpen:", isOpen);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Snippet" : "Create New Snippet"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter snippet title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a brief description" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Language select */}
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
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
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
            
            {/* Code field */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste your code here" 
                      className="min-h-[200px] font-mono"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Preview */}
            {form.watch("code") && (
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2">Preview</h3>
                <CodeBlock 
                  code={form.watch("code")} 
                  language={selectedLanguage} 
                  showLineNumbers={true}
                />
              </div>
            )}
            
            {/* Tags input */}
            <div>
              <FormLabel>Tags</FormLabel>
              <div className="flex items-center space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tags (press Enter)"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} variant="secondary" size="sm">
                  Add
                </Button>
              </div>
              
              {/* Tags display */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}