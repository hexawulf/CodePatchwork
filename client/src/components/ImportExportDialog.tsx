import { useMemo, useRef, useState, type DragEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, invalidateSnippetQueries } from "@/lib/queryClient";
import { downloadSnippetsExport } from "@/lib/exportSnippets";
import { Download, AlertCircle, Upload, CheckCircle2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CleanImportItem {
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  isFavorite: boolean;
  isPublic: boolean;
}

function parseImportPreview(raw: string): {
  valid: CleanImportItem[];
  skipped: number;
  error: string | null;
} {
  if (!raw.trim()) return { valid: [], skipped: 0, error: null };
  try {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const valid: CleanImportItem[] = [];
    let skipped = 0;

    for (const item of items) {
      if (!item || typeof item !== "object" || typeof item.code !== "string" || !item.code.trim()) {
        skipped++;
        continue;
      }
      valid.push({
        title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Untitled Snippet",
        code: item.code,
        language: typeof item.language === "string" && item.language.trim() ? item.language.trim() : "text",
        description: typeof item.description === "string" ? item.description : "",
        tags: Array.isArray(item.tags)
          ? item.tags.filter((t: unknown): t is string => typeof t === "string")
          : [],
        isFavorite: item.isFavorite === true,
        isPublic: item.isPublic === true,
      });
    }
    return { valid, skipped, error: null };
  } catch {
    return { valid: [], skipped: 0, error: "Invalid JSON format." };
  }
}

export default function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("import");
  const [importData, setImportData] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => parseImportPreview(importData), [importData]);

  const loadFile = async (file: File) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5 MB limit.");
      return;
    }
    const text = await file.text();
    setImportData(text);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await loadFile(file);
  };

  const handleImport = async () => {
    setError(null);
    if (!user) {
      setError("You must be logged in to import snippets.");
      return;
    }
    if (preview.error || preview.valid.length === 0) {
      setError(preview.error || "No valid snippets found to import.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await apiRequest<{ message?: string }>("POST", "/api/snippets/import", {
        snippets: preview.valid,
      });
      invalidateSnippetQueries(queryClient);
      toast({
        title: "Snippets Imported",
        description: result.message || `Imported ${preview.valid.length} snippets.`,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import snippets";
      setError(`${msg}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setError(null);
    if (!user) {
      setError("You must be logged in to export snippets.");
      return;
    }

    try {
      setIsLoading(true);
      const count = await downloadSnippetsExport();
      toast({
        title: "Snippets Exported",
        description: `${count} snippets exported as JSON.`,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export snippets";
      setError(`${msg}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setImportData("");
      setError(null);
      setDragging(false);
    }
    onOpenChange(nextOpen);
  };

  const shownError = error || (importData.trim() ? preview.error : null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Import / Export Library</DialogTitle>
          <DialogDescription>
            Drop a JSON export file, paste snippets below, or back up your entire library.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" value={activeTab} onValueChange={setActiveTab} className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import JSON</TabsTrigger>
            <TabsTrigger value="export">Export JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="pt-4 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <Upload className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Drop a `.json` file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Accepts CodePatchwork JSON exports (array or single snippet object)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) loadFile(file);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="importData">Or paste JSON directly</Label>
              <Textarea
                id="importData"
                placeholder='[{"title": "Helper", "language": "typescript", "code": "..."}]'
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={7}
                className="font-mono text-xs"
              />
            </div>

            {importData.trim() && !preview.error && (
              <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {preview.valid.length} valid {preview.valid.length === 1 ? "snippet" : "snippets"} ready
                  {preview.skipped > 0 ? ` (${preview.skipped} skipped — missing code)` : ""}
                </span>
              </div>
            )}

            {shownError && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{shownError}</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="pt-4 space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-6 text-center">
              <Download className="mx-auto mb-2.5 h-10 w-10 text-primary" />
              <h3 className="text-base font-semibold">Export All Snippets</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Download your full snippet library as a formatted JSON file for backup or migration.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === "import" ? (
            <Button
              onClick={handleImport}
              disabled={preview.valid.length === 0 || Boolean(preview.error) || isLoading}
            >
              {isLoading ? "Importing..." : `Import (${preview.valid.length})`}
            </Button>
          ) : (
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? "Exporting..." : "Download JSON"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
