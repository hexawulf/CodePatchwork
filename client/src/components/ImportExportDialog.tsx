import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UploadCloud, Download, AlertCircle } from "lucide-react";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportExportDialog({
  open,
  onOpenChange
}: ImportExportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("import");
  const [importData, setImportData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle Import
  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate JSON format
      let snippetsData;
      try {
        snippetsData = JSON.parse(importData);
      } catch (e) {
        setError("Invalid JSON format. Please check your input.");
        setIsLoading(false);
        return;
      }
      
      // Ensure snippets is an array
      const snippets = Array.isArray(snippetsData) ? snippetsData : [snippetsData];
      
      // Send to API
      const response = await apiRequest<{message: string, snippets: any[]}>("/api/snippets/import", "POST", { 
        snippets 
      });
      
      // Refresh snippets data
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
      
      // Show success message
      toast({
        title: "Snippets Imported",
        description: response.message || `Successfully imported snippets.`,
      });
      
      // Close dialog
      onOpenChange(false);
    } catch (err) {
      setError("Failed to import snippets. Please try again.");
      console.error("Import error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle Export
  const handleExport = () => {
    // Create a download link and trigger it
    const exportUrl = "/api/snippets/export";
    const link = document.createElement("a");
    link.href = exportUrl;
    link.download = "codepatchwork-snippets.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success toast
    toast({
      title: "Snippets Exported",
      description: "Your snippets have been exported successfully."
    });
    
    // Close dialog
    onOpenChange(false);
  };
  
  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setImportData("");
      setError(null);
    }
    onOpenChange(open);
  };
  
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
              
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
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
  },
  // More snippets...
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
            <Button onClick={handleExport}>
              Export Snippets
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}