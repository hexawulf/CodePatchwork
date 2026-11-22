import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  X,
  Copy,
  Check,
  FileCode2,
  Download,
  Star,
  Globe,
  Lock,
  Share2,
  Pencil,
  Trash2,
  CopyPlus,
  FolderOpen,
  WrapText,
  Hash,
  ExternalLink,
} from "lucide-react";
import type { CollectionWithCount, Snippet } from "@shared/schema";
import { cn } from "@/lib/utils";
import { getLanguageColor } from "@/lib/constants";
import { downloadSnippetFile, formatSnippetMarkdown } from "@/lib/snippets";
import { apiRequest, invalidateSnippetQueries } from "@/lib/queryClient";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { useCollectionContext } from "@/contexts/CollectionContext";
import { Button } from "@/components/ui/button";
import CodeBlock from "./CodeBlock";
import CommentSection from "./CommentSection";
import ShareLinkDialog from "./ShareLinkDialog";
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

interface SnippetDrawerProps {
  snippet: Snippet | null;
  onClose: () => void;
  isPublicView?: boolean;
}

export default function SnippetDrawer({ snippet, onClose, isPublicView = false }: SnippetDrawerProps) {
  const { user } = useAuthContext();
  const { prefs } = usePreferences();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    openEditEditor,
    deleteSnippet,
    duplicateSnippet,
    toggleFavorite,
    togglePublic,
    toggleLanguage,
    toggleTag,
  } = useSnippetContext();
  const { addSnippetToCollection, removeSnippetFromCollection } = useCollectionContext();

  const { isCopying: copiedCode, copy: copyCode } = useCopyToClipboard();
  const { isCopying: copiedMd, copy: copyMd } = useCopyToClipboard({
    successTitle: "Markdown copied!",
    successDescription: "Fenced code block copied to clipboard.",
  });

  const [showLineNumbers, setShowLineNumbers] = useState(prefs.showLineNumbers);
  const [wordWrap, setWordWrap] = useState(prefs.wordWrap);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [busyColId, setBusyColId] = useState<number | null>(null);

  const isOwner = Boolean(user && snippet?.userId && user.id === snippet.userId);

  const { data: collections = [] } = useQuery<CollectionWithCount[]>({
    queryKey: ["/api/collections"],
    enabled: Boolean(snippet && user && !isPublicView),
  });

  const { data: membership } = useQuery<{ collectionIds: number[] }>({
    queryKey: ["/api/snippets", snippet?.id ?? 0, "collections"],
    enabled: Boolean(snippet && user && !isPublicView),
  });

  const memberSet = new Set(membership?.collectionIds ?? []);

  const handleToggleCollection = async (collectionId: number) => {
    if (!snippet || busyColId !== null) return;
    setBusyColId(collectionId);
    try {
      if (memberSet.has(collectionId)) {
        await removeSnippetFromCollection(collectionId, snippet.id);
      } else {
        await addSnippetToCollection(collectionId, snippet.id);
      }
    } finally {
      setBusyColId(null);
    }
  };

  const handleShare = async () => {
    if (!snippet) return;
    try {
      setIsSharing(true);
      const data = await apiRequest<{ shareId?: string }>("POST", `/api/snippets/${snippet.id}/share`);
      if (!data?.shareId) throw new Error("No share ID returned");
      setShareUrl(`${window.location.origin}/shared/${data.shareId}`);
      setShareOpen(true);
      invalidateSnippetQueries(queryClient);
    } catch {
      toast({
        title: "Sharing failed",
        description: "Could not create a share link.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDuplicate = async () => {
    if (!snippet) return;
    await duplicateSnippet(snippet);
  };

  const handleDelete = async () => {
    if (!snippet) return;
    await deleteSnippet(snippet.id);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <DialogPrimitive.Root open={Boolean(snippet)} onOpenChange={(open) => !open && onClose()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-border bg-card shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          >
            {snippet && (
              <>
                {/* Sticky Drawer Header */}
                <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: getLanguageColor(snippet.language) }}
                      />
                      <DialogPrimitive.Title className="truncate text-lg font-semibold text-foreground">
                        {snippet.title}
                      </DialogPrimitive.Title>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          snippet.isPublic
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {snippet.isPublic ? (
                          <Globe className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                        {snippet.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    <DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(snippet.updatedAt), { addSuffix: true })} ·{" "}
                      {snippet.viewCount ?? 0} views
                    </DialogPrimitive.Description>
                  </div>

                  <div className="flex items-center gap-1">
                    {!isPublicView && isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleFavorite(snippet.id)}
                        aria-label={snippet.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            snippet.isFavorite ? "text-amber-400" : "text-muted-foreground",
                          )}
                          fill={snippet.isFavorite ? "currentColor" : "none"}
                        />
                      </Button>
                    )}
                    <DialogPrimitive.Close asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close">
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogPrimitive.Close>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-6 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => copyCode(snippet.code || "")}
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedCode ? "Copied" : "Copy"}
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
                    {snippet.isPublic && snippet.shareId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        asChild
                      >
                        <a
                          href={`/api/shared/${snippet.shareId}/raw`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Raw
                        </a>
                      </Button>
                    )}
                  </div>

                  {isOwner && !isPublicView && (
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => togglePublic(snippet.id)}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {snippet.isPublic ? "Make Private" : "Publish"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs"
                        onClick={handleShare}
                        disabled={isSharing}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs"
                        onClick={handleDuplicate}
                      >
                        <CopyPlus className="h-3.5 w-3.5" />
                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => openEditEditor(snippet)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {snippet.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {snippet.description}
                    </p>
                  )}

                  {/* Metadata tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {snippet.language && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPublicView) {
                            toggleLanguage(snippet.language);
                            onClose();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: getLanguageColor(snippet.language) }}
                        />
                        {snippet.language}
                      </button>
                    )}
                    {snippet.tags?.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          if (!isPublicView) {
                            toggleTag(tag);
                            onClose();
                          }
                        }}
                        className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>

                  {/* Full Code Viewer */}
                  <div className="overflow-hidden rounded-lg border border-border">
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
                            "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors",
                            showLineNumbers
                              ? "bg-primary/15 text-primary font-medium"
                              : "hover:bg-muted",
                          )}
                        >
                          <Hash className="h-3 w-3" />
                          Lines
                        </button>
                        <button
                          type="button"
                          onClick={() => setWordWrap((v) => !v)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors",
                            wordWrap
                              ? "bg-primary/15 text-primary font-medium"
                              : "hover:bg-muted",
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

                  {/* Inline Collection Membership */}
                  {user && !isPublicView && collections.length > 0 && (
                    <div className="rounded-lg border border-border p-4">
                      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <FolderOpen className="h-3.5 w-3.5" />
                        Collections
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {collections.map((col) => {
                          const active = memberSet.has(col.id);
                          return (
                            <button
                              type="button"
                              key={col.id}
                              disabled={busyColId === col.id}
                              onClick={() => handleToggleCollection(col.id)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                active
                                  ? "border-primary bg-primary/15 text-primary"
                                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                              )}
                            >
                              {active && <Check className="h-3 w-3" />}
                              {col.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inline Comments */}
                  <div className="border-t border-border pt-2">
                    <CommentSection snippetId={snippet.id} />
                  </div>
                </div>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {shareOpen && (
        <ShareLinkDialog open={shareOpen} onOpenChange={setShareOpen} shareUrl={shareUrl} />
      )}

      {confirmDelete && snippet && (
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
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
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
