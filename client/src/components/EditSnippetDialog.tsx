import { useState, useEffect } from "react";
import { type Snippet } from "@shared/schema";
import AddSnippetDialog from "./AddSnippetDialog";
import { useSnippetContext } from "@/contexts/SnippetContext";

interface EditSnippetDialogProps {
  snippetId?: number;
}

export default function EditSnippetDialog({ snippetId }: EditSnippetDialogProps) {
  const [open, setOpen] = useState(false);
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (snippetId && open) {
      fetchSnippet(snippetId);
    }
  }, [snippetId, open]);
  
  const fetchSnippet = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = window.location.origin + `/api/snippets/${id}`;
      const res = await fetch(API_URL);
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      
      const data = await res.json();
      setSnippet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch snippet");
      console.error("Error fetching snippet:", err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AddSnippetDialog 
      open={open}
      onOpenChange={setOpen} 
      snippetToEdit={snippet}
      isEditMode={true}
    />
  );
}