import { useState, memo } from "react";
import type { Snippet } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Copy,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  FolderPlus,
  FolderMinus,
  Share2,
  Globe,
  Lock,
  Maximize2,
  FileCode2,
  Download,
  CopyPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getLanguageColor } from "@/lib/constants";
import { downloadSnippetFile, formatSnippetMarkdown } from "@/lib/snippets";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest, invalidateSnippetQueries } from "@/lib/queryClient";
import CodeBlock from "./CodeBlock";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { useAuthContext } from "@/contexts/AuthContext";
import AddToCollectionDialog from "./AddToCollectionDialog";
import ShareLinkDialog from "./ShareLinkDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SnippetCardProps {
  snippet: Snippet;
  viewMode: "grid" | "list";
  isPublicView?: boolean;
  onRemoveFromCollection?: (snippetId: number) => void;
  onSelectLanguage?: (language: string) => void;
  onSelectTag?: (tag: string) => void;
}

const SnippetCard = memo(function SnippetCard({
  snippet,
  viewMode,
  isPublicView = false,
  onRemoveFromCollection,
  onSelectLanguage,
  onSelectTag,
}: SnippetCardProps) {
  const {
    toggleFavorite,
    togglePublic,
    deleteSnippet,
    duplicateSnippet,
    openInspector,
    openEditEditor,
    toggleLanguage,
    toggleTag,
  } = useSnippetContext();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isCopying, copy } = useCopyToClipboard();
  const { copy: copyMd } = useCopyToClipboard({
    successTitle: "Markdown copied!",
    successDescription: "Fenced code block copied to clipboard.",
  });

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const isOwner = Boolean(user && snippet.userId && user.id === snippet.userId);
  const copyCode = () => copy(snippet.code || "");

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const data = await apiRequest<{ shareId?: string }>("POST", `/api/snippets/${snippet.id}/share`);
      if (!data?.shareId) throw new Error("No share ID returned from server");
      setShareUrl(`${window.location.origin}/shared/${data.shareId}`);
      setIsShareDialogOpen(true);
      invalidateSnippetQueries(queryClient);
    } catch {
      toast({
        title: "Sharing failed",
        description: "Could not create a share link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <article
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all duration-150 hover:border-primary/40 hover:shadow-md overflow-hidden",
        viewMode === "list" && "md:flex-row",
      )}
    >
      {/* Metadata & Header Section */}
      <div
        className={cn(
          "flex flex-col p-4 pb-3",
          viewMode === "list" && "md:w-[38%] md:shrink-0 md:border-r md:border-border",
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <button
            type="button"
            onClick={() => openInspector(snippet)}
            className="flex min-w-0 items-center gap-2 text-left group/title"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: getLanguageColor(snippet.language) }}
            />
            <h3 className="truncate text-[15px] font-semibold text-foreground group-hover/title:text-primary transition-colors">
              {snippet.title}
            </h3>
          </button>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={copyCode}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                isCopying
                  ? "text-emerald-500"
                  : "text-muted-foreground opacity-70 hover:bg-muted hover:text-foreground group-hover:opacity-100",
              )}
              aria-label="Copy code"
              title="Copy code"
            >
              {isCopying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => openInspector(snippet)}
              className="rounded-md p-1.5 text-muted-foreground opacity-70 hover:bg-muted hover:text-foreground group-hover:opacity-100 transition-colors"
              aria-label="Inspect snippet"
              title="Expand snippet"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            {!isPublicView && isOwner && (
              <button
                type="button"
                onClick={() => toggleFavorite(snippet.id)}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  snippet.isFavorite
                    ? "text-amber-400 hover:text-amber-500"
                    : "text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground group-hover:opacity-100",
                )}
                aria-label={snippet.isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className="h-4 w-4" fill={snippet.isFavorite ? "currentColor" : "none"} />
              </button>
            )}

            {!isPublicView && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground opacity-70 hover:bg-muted hover:text-foreground group-hover:opacity-100 transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={copyCode}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy code
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyMd(formatSnippetMarkdown(snippet))}>
                    <FileCode2 className="mr-2 h-4 w-4" />
                    Copy as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadSnippetFile(snippet)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download file
                  </DropdownMenuItem>
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openEditEditor(snippet)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateSnippet(snippet)}>
                        <CopyPlus className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShare} disabled={isSharing}>
                        <Share2 className="mr-2 h-4 w-4" />
                        {isSharing ? "Creating link..." : "Share link"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePublic(snippet.id)}>
                        <Globe className="mr-2 h-4 w-4" />
                        {snippet.isPublic ? "Make private" : "Make public"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsCollectionDialogOpen(true)}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Add to collection
                      </DropdownMenuItem>
                      {onRemoveFromCollection && (
                        <DropdownMenuItem onClick={() => onRemoveFromCollection(snippet.id)}>
                          <FolderMinus className="mr-2 h-4 w-4" />
                          Remove from collection
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowConfirmDelete(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {snippet.description && (
          <p className="mb-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {snippet.description}
          </p>
        )}

        {/* Language, tags, and inline visibility */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {snippet.language &&
            (onSelectLanguage || !isPublicView ? (
              <button
                type="button"
                onClick={() =>
                  onSelectLanguage ? onSelectLanguage(snippet.language) : toggleLanguage(snippet.language)
                }
                className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                {snippet.language}
              </button>
            ) : (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {snippet.language}
              </span>
            ))}
          {!isPublicView && snippet.isPublic && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <Globe className="h-3 w-3" />
              Public
            </span>
          )}
          {snippet.tags?.slice(0, 4).map((tag) =>
            onSelectTag || !isPublicView ? (
              <button
                type="button"
                key={tag}
                onClick={() => (onSelectTag ? onSelectTag(tag) : toggleTag(tag))}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                #{tag}
              </button>
            ) : (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                #{tag}
              </span>
            ),
          )}
          {snippet.tags && snippet.tags.length > 4 && (
            <span className="text-[11px] text-muted-foreground">+{snippet.tags.length - 4}</span>
          )}
        </div>

        {/* Code Preview in Grid mode (or mobile List mode) */}
        <div
          onClick={() => openInspector(snippet)}
          className={cn(
            "mt-auto cursor-pointer overflow-hidden rounded-lg border border-border/80 transition-opacity hover:opacity-95",
            viewMode === "list" && "md:hidden",
          )}
        >
          <CodeBlock
            code={snippet.code || ""}
            language={snippet.language || "text"}
            maxLines={9}
            compact={true}
            showLineNumbers={false}
          />
        </div>

        {/* Desktop List-mode footer */}
        {viewMode === "list" && (
          <div className="mt-auto hidden pt-3 text-[11px] text-muted-foreground md:flex md:items-center md:justify-between">
            <span>Updated {formatDistanceToNow(new Date(snippet.updatedAt), { addSuffix: true })}</span>
            <span className="inline-flex items-center gap-1">
              {!snippet.isPublic && <Lock className="h-3 w-3 opacity-60" />}
              {snippet.viewCount ?? 0} views
            </span>
          </div>
        )}
      </div>

      {/* Desktop List-mode Code Preview */}
      {viewMode === "list" && (
        <div
          onClick={() => openInspector(snippet)}
          className="hidden cursor-pointer overflow-hidden p-3 md:flex md:flex-1 md:flex-col md:justify-center"
        >
          <div className="overflow-hidden rounded-lg border border-border/80">
            <CodeBlock
              code={snippet.code || ""}
              language={snippet.language || "text"}
              maxLines={8}
              compact={true}
            />
          </div>
        </div>
      )}

      {/* Grid-mode Footer */}
      {viewMode === "grid" && (
        <div className="mt-auto flex items-center justify-between border-t border-border/70 bg-muted/25 px-4 py-2 text-[11px] text-muted-foreground">
          <span>Updated {formatDistanceToNow(new Date(snippet.updatedAt), { addSuffix: true })}</span>
          <span>{snippet.viewCount ?? 0} views</span>
        </div>
      )}

      {showConfirmDelete && (
        <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete snippet?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{snippet.title}&rdquo;. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteSnippet(snippet.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isCollectionDialogOpen && (
        <AddToCollectionDialog
          open={isCollectionDialogOpen}
          onOpenChange={setIsCollectionDialogOpen}
          snippet={snippet}
        />
      )}

      {isShareDialogOpen && (
        <ShareLinkDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          shareUrl={shareUrl}
        />
      )}
    </article>
  );
});

export default SnippetCard;
