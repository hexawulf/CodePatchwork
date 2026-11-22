import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { LibraryMeta, Snippet } from "@shared/schema";
import { LANGUAGES } from "@/lib/constants";
import CodeBlock from "./CodeBlock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Code2, X, Globe, Lock } from "lucide-react";

interface AddSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snippetToEdit?: Snippet | null;
  isEditMode?: boolean;
}

export default function AddSnippetDialog({
  open,
  onOpenChange,
  snippetToEdit = null,
  isEditMode = false,
}: AddSnippetDialogProps) {
  const { toast } = useToast();
  const { createSnippet, updateSnippet } = useSnippetContext();
  const { prefs } = usePreferences();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: meta } = useQuery<LibraryMeta>({
    queryKey: ["/api/meta"],
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setPreviewMode(false);
      setTagDraft("");
      if (isEditMode && snippetToEdit) {
        setTitle(snippetToEdit.title);
        setCode(snippetToEdit.code);
        setDescription(snippetToEdit.description || "");
        setLanguage(snippetToEdit.language || "typescript");
        setTags(snippetToEdit.tags ?? []);
        setIsPublic(snippetToEdit.isPublic === true);
      } else {
        setTitle("");
        setCode("");
        setDescription("");
        setLanguage("typescript");
        setTags([]);
        setIsPublic(false);
      }
    }
  }, [open, isEditMode, snippetToEdit]);

  const addTag = (raw: string) => {
    const clean = raw.trim().toLowerCase().replace(/^#/, "");
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean]);
    setTagDraft("");
  };

  const removeTag = (target: string) => {
    setTags((prev) => prev.filter((t) => t !== target));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleCodeKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const indent = " ".repeat(prefs.tabSize);
    const next = code.slice(0, start) + indent + code.slice(end);
    setCode(next);
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = start + indent.length;
    });
  };

  const suggestedTags = (meta?.tags ?? [])
    .map((t) => t.name)
    .filter(
      (t) =>
        !tags.includes(t) &&
        (!tagDraft.trim() || t.toLowerCase().includes(tagDraft.trim().toLowerCase())),
    )
    .slice(0, 6);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const finalTags = tagDraft.trim()
      ? Array.from(new Set([...tags, tagDraft.trim().toLowerCase().replace(/^#/, "")]))
      : tags;

    if (!title.trim() || !code.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and code are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        code,
        description: description.trim() || null,
        language,
        tags: finalTags,
        isPublic,
      };
      if (isEditMode && snippetToEdit) {
        await updateSnippet(snippetToEdit.id, payload);
      } else {
        await createSnippet(payload);
      }
      onOpenChange(false);
    } catch {
      // Error toast is already handled by SnippetContext mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[740px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Snippet" : "New Snippet"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your snippet code, tags, or visibility."
              : "Save a reusable snippet with syntax highlighting and tags."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="snippet-title">Title</Label>
              <Input
                id="snippet-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Debounced React hook"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="snippet-lang">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="snippet-lang">
                  <SelectValue placeholder="Language" />
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="snippet-desc">Description (optional)</Label>
            <Input
              id="snippet-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short context or usage note"
            />
          </div>

          {/* Tag chips with autocomplete */}
          <div className="space-y-1.5">
            <Label htmlFor="snippet-tags">Tags</Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-ring">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive"
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id="snippet-tags"
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length ? "Add tag..." : "Type a tag and press Enter"}
                className="min-w-[140px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            {suggestedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <span className="text-[11px] text-muted-foreground mr-1">Suggestions:</span>
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Code editor with Write / Preview toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="snippet-code">Code</Label>
              <div className="inline-flex rounded-md border border-border bg-muted p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                    !previewMode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                    previewMode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
              </div>
            </div>

            {previewMode ? (
              <div className="min-h-[220px] max-h-[340px] overflow-auto rounded-md border border-border">
                <CodeBlock code={code || "// Nothing to preview yet"} language={language} />
              </div>
            ) : (
              <Textarea
                id="snippet-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleCodeKeyDown}
                placeholder="Paste or type your code here (Tab inserts spaces)"
                className="min-h-[220px] text-sm leading-relaxed code-scroll"
                style={{
                  fontFamily: `"${prefs.editorFont}", ui-monospace, SFMono-Regular, Menlo, monospace`,
                }}
                required
              />
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              {isPublic ? (
                <Globe className="h-4 w-4 text-emerald-500" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="snippet-public" className="text-sm font-medium cursor-pointer">
                  {isPublic ? "Public snippet" : "Private snippet"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Visible on the public gallery and via share links."
                    : "Visible only to you."}
                </p>
              </div>
            </div>
            <Switch id="snippet-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Snippet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
