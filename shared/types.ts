import type { Comment } from "./schema";

// What GET /api/snippets/:id/comments returns: the author's display name
// instead of their Firebase UID, which is never sent to other users.
export type CommentView = Omit<Comment, "userId"> & { authorName: string };
