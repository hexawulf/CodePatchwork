import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Comment } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface CommentSectionProps {
  snippetId: number;
}

export default function CommentSection({ snippetId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading, error } = useQuery<Comment[]>({
    queryKey: [`/api/snippets/${snippetId}/comments`],
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      await apiRequest(`/api/snippets/${snippetId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: newComment,
          userId: null, // Will be replaced with actual user id when auth is implemented
          authorName: 'Anonymous' // Temporary until auth is implemented
        })
      });
      
      toast({
        title: 'Comment posted',
        description: 'Your comment has been successfully added.',
      });
      
      // Clear the form and refetch comments
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: [`/api/snippets/${snippetId}/comments`] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post your comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-medium">Comments</h3>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
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
      <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
        <p>Failed to load comments. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Comments</h3>
      
      <form onSubmit={handleSubmitComment} className="mb-6">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="mb-2 min-h-[100px]"
        />
        <Button 
          type="submit" 
          disabled={isSubmitting || !newComment.trim()}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>
      
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
              <Avatar>
                <AvatarFallback>
                  {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.authorName || 'Anonymous'}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}