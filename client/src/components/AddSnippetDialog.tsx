import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { type Snippet } from "@shared/schema";
import { LANGUAGES } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddSnippetDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  snippetToEdit?: Snippet | null;
  isEditMode?: boolean;
}

export default function AddSnippetDialog({ 
  open: controlledOpen, 
  onOpenChange, 
  snippetToEdit = null,
  isEditMode = false
}: AddSnippetDialogProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Remove useSnippetContext for now since we're using direct API calls
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine if the component is controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  const setOpen = (newOpen: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };
  
  // Set form values when snippetToEdit changes
  useEffect(() => {
    if (snippetToEdit) {
      setTitle(snippetToEdit.title);
      setCode(snippetToEdit.code);
      setDescription(snippetToEdit.description || "");
      setLanguage(snippetToEdit.language);
    }
  }, [snippetToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !code.trim()) {
      toast({
        title: "Error",
        description: "Title and code are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const snippet = {
        title,
        code,
        description: description || null,
        language,
        tags: snippetToEdit?.tags || [],
        userId: null
      };
      
      // Determine if we're creating or updating
      const isEditing = isEditMode && snippetToEdit;
      const API_URL = isEditing 
        ? `/api/snippets/${snippetToEdit.id}` 
        : '/api/snippets';
        
      // FIXED: Use apiRequest instead of direct fetch to include authentication
      const result = await apiRequest(
        isEditing ? 'PUT' : 'POST',
        API_URL,
        snippet
      );
      
      console.log(isEditing ? "Snippet updated successfully:" : "Snippet created successfully:", result);
      
      toast({
        title: "Success",
        description: isEditing ? "Snippet updated successfully" : "Snippet created successfully",
      });
      
      // Reset form and close modal
      setTitle("");
      setCode("");
      setDescription("");
      setLanguage("javascript");
      setOpen(false);
      
      // Refresh snippets data
      queryClient.invalidateQueries({ queryKey: ['/api/snippets'] });
    } catch (error) {
      console.error("Error creating snippet:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} snippet. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only render the trigger button when not controlled externally */}
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm" className="flex items-center">
            <Plus className="h-4 w-4 mr-1" />
            New Snippet
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Snippet' : 'Create New Snippet'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update your existing code snippet'
              : 'Add a new code snippet to your collection'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter snippet title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium">Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">Code</label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here"
              className="min-h-[150px] font-mono"
              required
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (isEditMode ? "Updating..." : "Creating...") 
                : (isEditMode ? "Update Snippet" : "Create Snippet")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
