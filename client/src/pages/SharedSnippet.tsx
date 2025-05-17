import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Snippet } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { Copy, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CodeBlock from '@/components/CodeBlock';
import CommentSection from '@/components/CommentSection';

export default function SharedSnippet() {
  const [_, navigate] = useLocation();
  const { shareId } = useParams();
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  // Fetch shared snippet
  const { data: snippet, isLoading, error } = useQuery<Snippet>({
    queryKey: [`/api/shared/${shareId}`],
    retry: false,
  });

  // Function to copy code to clipboard
  const copyToClipboard = async () => {
    if (!snippet?.code) return;
    
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(snippet.code);
      toast({
        title: "Code copied!",
        description: "The code snippet has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsCopying(false), 1000);
    }
  };

  // Function to get language color
  const getLanguageColor = (language?: string) => {
    if (!language) return "#718096";
    
    const colors: Record<string, string> = {
      javascript: "#F7DF1E",
      typescript: "#3178C6",
      python: "#3572A5",
      java: "#B07219",
      go: "#00ADD8",
      css: "#563D7C",
      html: "#E34F26",
      jsx: "#61DAFB",
      tsx: "#61DAFB",
      sql: "#e38c00",
      bash: "#4EAA25",
    };
    
    return colors[language.toLowerCase()] || "#718096";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading snippet...</p>
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="mb-4 text-2xl font-bold">Snippet Not Found</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The snippet you're looking for either doesn't exist or is not public.
        </p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 mx-auto">
      <Button 
        variant="outline" 
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{snippet.title}</h1>
            {snippet.isFavorite && (
              <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
            )}
          </div>
          
          {snippet.description && (
            <p className="text-slate-500 dark:text-slate-400 mb-4">{snippet.description}</p>
          )}
          
          <div className="mb-6 flex flex-wrap gap-1">
            {snippet.language && (
              <span 
                className="text-xs py-1 px-2 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
              >
                {snippet.language}
              </span>
            )}
            
            {snippet.tags && snippet.tags.map(tag => (
              <span 
                key={tag} 
                className="text-xs py-1 px-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="relative rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 rounded-bl text-xs px-2 py-1 flex items-center">
              {snippet.language && (
                <>
                  <span 
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: getLanguageColor(snippet.language) }}
                  ></span>
                  <span className="text-slate-700 dark:text-slate-300 mr-2">{snippet.language}</span>
                </>
              )}
              <button 
                className={`${isCopying ? 'text-green-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                aria-label="Copy code"
                onClick={copyToClipboard}
                disabled={isCopying}
              >
                <Copy className={`h-4 w-4 ${isCopying ? 'animate-ping' : ''}`} />
              </button>
            </div>
            
            <div className="mt-8 p-4">
              <CodeBlock 
                code={snippet.code || ""} 
                language={snippet.language || "text"} 
                showLineNumbers={true}
              />
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-3 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center">
          <span>
            Updated {formatDistanceToNow(new Date(snippet.updatedAt), { addSuffix: true })}
          </span>
          <span>{snippet.viewCount || 0} uses</span>
        </div>
        
        {/* Add Comment Section if the snippet exists and has an ID */}
        {snippet && snippet.id && (
          <CommentSection snippetId={snippet.id} />
        )}
      </div>
    </div>
  );
}