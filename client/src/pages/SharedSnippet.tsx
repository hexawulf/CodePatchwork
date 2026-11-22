import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Snippet } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import {
  Copy,
  Check,
  Star,
  ArrowLeft,
  Download,
  FileCode2,
  ExternalLink,
  Hash,
  WrapText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLanguageColor } from "@/lib/constants";
import { downloadSnippetFile, formatSnippetMarkdown } from "@/lib/snippets";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { usePreferences } from "@/contexts/PreferencesContext";
import { cn } from "@/lib/utils";
import CodeBlock from "@/components/CodeBlock";
import CommentSection from "@/components/CommentSection";

export default function SharedSnippet() {
  const [, navigate] = useLocation();
  const { shareId } = useParams();
  const { prefs } = usePreferences();
  const [showLineNumbers, setShowLineNumbers] = useState(prefs.showLineNumbers);
  const [wordWrap, setWordWrap] = useState(prefs.wordWrap);

  const { isCopying, copy } = useCopyToClipboard();
  const { isCopying: copiedMd, copy: copyMd } = useCopyToClipboard({
    successTitle: "Markdown copied!",
    successDescription: "Fenced code block copied to clipboard.",
  });

  const { data: snippet, isLoading, error } = useQuery<Snippet>({
    queryKey: [`/api/shared/${shareId}`],
    enabled: Boolean(shareId),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading snippet...</p>
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Snippet Not Found</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          This snippet either does not exist or is set to private.
        </p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to CodePatchwork
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" size="sm" className="-ml-2 mb-5 gap-1.5" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          Back to CodePatchwork
        </Button>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="p-6">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: getLanguageColor(snippet.language) }}
                />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {snippet.title}
                </h1>
                {snippet.isFavorite && (
                  <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => copy(snippet.code || "")}
                >
                  {isCopying ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {isCopying ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => copyMd(formatSnippetMarkdown(snippet))}
                >
                  {copiedMd ? <Check className="h-3.5 w-3.5" /> : <FileCode2 className="h-3.5 w-3.5" />}
                  Markdown
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => downloadSnippetFile(snippet)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                {shareId && (
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
                    <a
                      href={`/api/shared/${encodeURIComponent(shareId)}/raw`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Raw
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {snippet.description && (
              <p className="mb-4 text-sm text-muted-foreground">{snippet.description}</p>
            )}

            <div className="mb-5 flex flex-wrap gap-1.5">
              {snippet.language && (
                <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {snippet.language}
                </span>
              )}
              {snippet.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                <span>
                  {snippet.code.split("\n").length}{" "}
                  {snippet.code.split("\n").length === 1 ? "line" : "lines"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowLineNumbers((v) => !v)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px]",
                      showLineNumbers ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted",
                    )}
                  >
                    <Hash className="h-3 w-3" />
                    Lines
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordWrap((v) => !v)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px]",
                      wordWrap ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted",
                    )}
                  >
                    <WrapText className="h-3 w-3" />
                    Wrap
                  </button>
                </div>
              </div>
              <CodeBlock
                code={snippet.code || ""}
                language={snippet.language || "text"}
                showLineNumbers={showLineNumbers}
                wordWrap={wordWrap}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/25 px-6 py-3 text-xs text-muted-foreground">
            <span>Updated {formatDistanceToNow(new Date(snippet.updatedAt), { addSuffix: true })}</span>
            <span>{snippet.viewCount || 0} views</span>
          </div>

          {snippet.id && (
            <div className="border-t border-border px-6 pb-6">
              <CommentSection snippetId={snippet.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
