import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface CopyOptions {
  successTitle?: string;
  successDescription?: string;
  errorDescription?: string;
  resetMs?: number;
}

export function useCopyToClipboard({
  successTitle = "Code copied!",
  successDescription = "The code snippet has been copied to your clipboard.",
  errorDescription = "Could not copy to clipboard.",
  resetMs = 1000,
}: CopyOptions = {}) {
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        setIsCopying(true);
        await navigator.clipboard.writeText(text);
        toast({ title: successTitle, description: successDescription });
        return true;
      } catch (error) {
        console.error("Failed to copy:", error);
        toast({
          title: "Copy failed",
          description: errorDescription,
          variant: "destructive",
        });
        return false;
      } finally {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setIsCopying(false), resetMs);
      }
    },
    [toast, successTitle, successDescription, errorDescription, resetMs],
  );

  return { isCopying, copy };
}
