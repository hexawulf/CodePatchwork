import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { UploadCloud, Download, AlertCircle } from "lucide-react";
import { getAuth } from "firebase/auth";
import { useAuthContext } from "@/contexts/AuthContext";

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
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("import");
  const [importData, setImportData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle Import
  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure user is authenticated
      if (!user) {
        setError("You must be logged in to import snippets.");
        setIsLoading(false);
        return;
      }
      
      // Get Firebase auth instance and current user
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      
      // Check if Firebase user exists
      if (!firebaseUser) {
        console.error("Firebase user not found but local user exists");
        setError("Authentication error. Please try logging in again.");
        setIsLoading(false);
        return;
      }
      
      // Get id token
      let token;
      try {
        token = await firebaseUser.getIdToken(true);
        console.log("Got Firebase ID token for API request");
      } catch (tokenError) {
        console.error("Failed to get ID token:", tokenError);
        setError("Authentication token error. Please refresh the page and try again.");
        setIsLoading(false);
        return;
      }
      
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
      const rawSnippets = Array.isArray(snippetsData) ? snippetsData : [snippetsData];
      
      // Clean the snippets to remove any ID fields and auto-generated fields
      const cleanSnippets = rawSnippets.map(snippet => {
        // Only keep the fields we want to import
        return {
          title: snippet.title || "Untitled Snippet",
          code: snippet.code || "",
          language: snippet.language || "text",
          description: snippet.description || "",
          tags: Array.isArray(snippet.tags) ? snippet.tags : [],
          // User ID will be set on the server side from the auth token
        };
      });
      
      console.log(`Importing ${cleanSnippets.length} snippets...`);
      
      // Send to API with auth token
      const response = await fetch("/api/snippets/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ snippets: cleanSnippets })
      });
      
      // Handle non-2xx responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Import response error:", response.status, errorText);
        throw new Error(`Server returned ${response.status}: ${response.statusText || errorText}`);
      }
      
      const result = await response.json();
      console.log("Import successful:", result);
      
      // Refresh snippets data - try different query keys
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/snippets'] });
      
      // Force a complete refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      // Show success message
      toast({
        title: "Snippets Imported",
        description: result.message || `Successfully imported snippets.`,
      });
      
      // Close dialog
      onOpenChange(false);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to import snippets";
      setError(`${errorMessage}. Please try again.`);
      console.error("Import error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle Export
  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      // Ensure user is authenticated
      if (!user) {
        setError("You must be logged in to export snippets.");
        setIsLoading(false);
        return;
      }
      
      // Get Firebase auth instance and current user
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        setError("Authentication error. Please try logging in again.");
        setIsLoading(false);
        return;
      }
      
      // Get id token
      const token = await firebaseUser.getIdToken(true);
      
      // Create a download with authenticated request
      const exportUrl = "/api/snippets/export";
      
      // For authenticated downloads, we need to use fetch with credentials
      // and then create a blob URL from the response
      const response = await fetch(exportUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      // Get the response data as JSON
      const snippetsData = await response.json();
      
      // Create a blob URL
      const blob = new Blob([JSON.stringify(snippetsData, null, 2)], { 
        type: "application/json" 
      });
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a download link and trigger it
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `codepatchwork-snippets-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      // Show success toast
      toast({
        title: "Snippets Exported",
        description: "Your snippets have been exported successfully."
      });
      
      // Close dialog
      onOpenChange(false);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to export snippets";
      setError(`${errorMessage}. Please try again.`);
      console.error("Export error:", err);
    } finally {
      setIsLoading(false);
    }
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
              
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
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
