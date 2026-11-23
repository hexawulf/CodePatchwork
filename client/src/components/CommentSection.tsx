import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Comment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentSectionProps {
  snippetId: number;
}

export default function CommentSection({ snippetId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, signIn } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: comments, isLoading, error } = useQuery<Comment[]>({
    queryKey: [`/api/snippets/${snippetId}/comments`],
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);

      await apiRequest("POST", `/api/snippets/${snippetId}/comments`, {
        content: newComment,
      });

      toast({
        title: "Comment posted",
        description: "Your comment has been successfully added.",
      });

      setNewComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/snippets/${snippetId}/comments`] });
    } catch {
      toast({
        title: "Error",
        description: "Failed to post your comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Comments</h3>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex space-x-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <p>Failed to load comments. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          Comments{comments && comments.length > 0 ? ` (${comments.length})` : ""}
        </h3>
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-5">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="mb-2 min-h-[88px]"
          />
          <Button type="submit" size="sm" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      ) : (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Sign in to join the discussion.</span>
          <Button type="button" size="sm" variant="outline" onClick={() => signIn()}>
            Sign In
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex space-x-3 rounded-lg border border-border/70 bg-muted/35 p-3.5"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {comment.userId ? comment.userId.charAt(0).toUpperCase() : "A"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {comment.userId || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>No comments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}