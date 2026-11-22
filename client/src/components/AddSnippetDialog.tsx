import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, invalidateSnippetQueries } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import type { Snippet } from "@shared/schema";
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
  isEditMode = false,
}: AddSnippetDialogProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && snippetToEdit) {
        setTitle(snippetToEdit.title);
        setCode(snippetToEdit.code);
        setDescription(snippetToEdit.description || "");
        setLanguage(snippetToEdit.language);
        setTagsInput(snippetToEdit.tags?.join(", ") || "");
      } else if (!isEditMode) {
        setTitle("");
        setCode("");
        setDescription("");
        setLanguage("javascript");
        setTagsInput("");
      }
    }
  }, [open, isEditMode, snippetToEdit]);

  const handleSubmit = async (e: FormEvent) => {
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
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        code,
        description: description.trim() || null,
        language,
        tags,
      };

      const isEditing = isEditMode && snippetToEdit;
      await apiRequest(
        isEditing ? "PUT" : "POST",
        isEditing ? `/api/snippets/${snippetToEdit.id}` : "/api/snippets",
        payload,
      );

      toast({
        title: "Success",
        description: isEditing ? "Snippet updated successfully" : "Snippet created successfully",
      });

      setOpen(false);
      invalidateSnippetQueries(queryClient);
    } catch (error) {
      console.error("Error saving snippet:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "create"} snippet. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogTitle>{isEditMode ? "Edit Snippet" : "Create New Snippet"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your existing code snippet"
              : "Add a new code snippet to your collection"}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label htmlFor="tags" className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="react, hooks, utils"
              />
            </div>
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
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Snippet"
                  : "Create Snippet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
