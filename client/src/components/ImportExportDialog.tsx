import { useState } from "react";
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
import { Download, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("import");
  const [importData, setImportData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    if (!user) {
      setError("You must be logged in to import snippets.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(importData);
    } catch {
      setError("Invalid JSON format. Please check your input.");
      return;
    }

    const rawSnippets = Array.isArray(parsed) ? parsed : [parsed];
    const cleanSnippets = rawSnippets.map((snippet: Record<string, unknown>) => ({
      title: typeof snippet?.title === "string" && snippet.title ? snippet.title : "Untitled Snippet",
      code: typeof snippet?.code === "string" ? snippet.code : "",
      language: typeof snippet?.language === "string" && snippet.language ? snippet.language : "text",
      description: typeof snippet?.description === "string" ? snippet.description : "",
      tags: Array.isArray(snippet?.tags) ? snippet.tags : [],
      isFavorite: snippet?.isFavorite === true,
      isPublic: snippet?.isPublic === true,
    }));

    try {
      setIsLoading(true);
      const result = await apiRequest<{ message?: string }>("POST", "/api/snippets/import", {
        snippets: cleanSnippets,
      });

      invalidateSnippetQueries(queryClient);
      toast({
        title: "Snippets Imported",
        description: result.message || "Successfully imported snippets.",
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import snippets";
      setError(`${msg}. Please try again.`);
      console.error("Import error:", err);
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
        description: `${count} snippets exported successfully.`,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export snippets";
      setError(`${msg}. Please try again.`);
      console.error("Export error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setImportData("");
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const errorBanner = error && (
    <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
      <p className="text-sm">{error}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import / Export Snippets</DialogTitle>
          <DialogDescription>
            Import snippets from JSON or export your collection to share with others.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" value={activeTab} onValueChange={setActiveTab} className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="importData">Paste JSON Snippet Data</Label>
                <Textarea
                  id="importData"
                  placeholder="Paste JSON data here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {errorBanner}

              <div className="text-sm text-slate-500 dark:text-slate-400">
                <p>Format: Array of snippet objects with required fields:</p>
                <pre className="bg-slate-100 dark:bg-slate-800 p-2 rounded mt-1 text-xs overflow-auto">
                  {`[
  {
    "title": "Snippet Title",
    "code": "console.log('Hello');",
    "language": "javascript",
    "description": "Optional description",
    "tags": ["tag1", "tag2"]
  }
]`}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="pt-4">
            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-md text-center">
                <Download className="h-12 w-12 mx-auto text-primary mb-2" />
                <h3 className="text-lg font-medium">Export All Snippets</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Download all your snippets as a JSON file that you can import later or share with others.
                </p>
              </div>

              {errorBanner}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === "import" ? (
            <Button onClick={handleImport} disabled={!importData.trim() || isLoading}>
              {isLoading ? "Importing..." : "Import Snippets"}
            </Button>
          ) : (
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? "Exporting..." : "Export Snippets"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
