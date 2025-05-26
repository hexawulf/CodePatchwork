import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  expectJson?: boolean;
}

// Transform functions to convert database column names to TypeScript property names
function transformCollection(collection: any) {
  if (!collection) return collection;
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    userId: collection.userid || collection.userId,           // Handle both formats
    createdAt: collection.createdat || collection.createdAt,  // Handle both formats
    updatedAt: collection.updatedat || collection.updatedAt,  // Handle both formats
  };
}

function transformSnippet(snippet: any) {
  if (!snippet) return snippet;
  return {
    id: snippet.id,
    title: snippet.title,
    description: snippet.description,
    code: snippet.code,
    language: snippet.language,
    tags: snippet.tags,
    userId: snippet.userid || snippet.userId,
    createdAt: snippet.createdat || snippet.createdAt,
    updatedAt: snippet.updatedat || snippet.updatedAt,
    viewCount: snippet.viewcount || snippet.viewCount,
    isFavorite: snippet.isfavorite || snippet.isFavorite,
    shareId: snippet.shareid || snippet.shareId,
    isPublic: snippet.ispublic || snippet.isPublic,
  };
}

function transformComment(comment: any) {
  if (!comment) return comment;
  return {
    id: comment.id,
    snippetId: comment.snippetid || comment.snippetId,
    content: comment.content,
    userId: comment.userid || comment.userId,
    createdAt: comment.createdat || comment.createdAt,
    updatedAt: comment.updatedat || comment.updatedAt,
  };
}

// Transform API responses based on URL patterns
function transformApiResponse(url: string, data: any) {
  if (!data) return data;
  
  // Handle array responses
  if (Array.isArray(data)) {
    if (url.includes('/collections')) {
      return data.map(transformCollection);
    } else if (url.includes('/snippets')) {
      return data.map(transformSnippet);
    } else if (url.includes('/comments')) {
      return data.map(transformComment);
    }
    return data;
  }
  
  // Handle single object responses
  if (url.includes('/collections')) {
    return transformCollection(data);
  } else if (url.includes('/snippets')) {
    return transformSnippet(data);
  } else if (url.includes('/comments')) {
    return transformComment(data);
  }
  
  return data;
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  // Get the Firebase ID token if the user is signed in
  let token = null;
  try {
    // Get the current user and their ID token
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken();
      console.log("[apiRequest] Got Firebase ID token, length:", token.length);
    } else {
      console.log("[apiRequest] No current user found");
    }
  } catch (e) {
    console.error("[apiRequest] Error getting Firebase ID token:", e);
    token = null;
  }

  // Build headers
  const headers: Record<string, string> = {};
  
  // Only add Content-Type if we have data to send
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add Authorization header if we have a token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("[apiRequest] Adding Authorization header to request");
  } else {
    console.log("[apiRequest] No token available, making unauthenticated request");
  }

  console.log(`[apiRequest] Making ${method} request to ${url}`);

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Defensive: check for JSON response
  const contentType = res.headers.get("content-type");
  
  // If we explicitly don't expect JSON or it's a 204 No Content, return early
  if (options.expectJson === false || res.status === 204) {
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    console.log(`[apiRequest] ${method} ${url} completed successfully (no JSON response)`);
    return undefined as T;
  }
  
  if (contentType && contentType.includes("application/json")) {
    const json = await res.json();
    if (!res.ok) {
      console.error(`[apiRequest] ${method} ${url} failed:`, json);
      throw new Error(json.message || `API error: ${res.status}`);
    }
    console.log(`[apiRequest] ${method} ${url} completed successfully`);
    
    // Transform the response before returning
    const transformedJson = transformApiResponse(url, json);
    return transformedJson;
  } else {
    // Not JSON, likely an error page
    if (!res.ok) {
      const text = await res.text();
      console.error(`[apiRequest] ${method} ${url} failed with non-JSON response:`, text.slice(0, 100));
      throw new Error(`${res.status}: Unexpected response from server: ${text.slice(0, 100)}`);
    }
    const text = await res.text();
    throw new Error("Unexpected response from server: " + text.slice(0, 100));
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // For queries, we also need to attach the auth token
    let token = null;
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        token = await currentUser.getIdToken();
      }
    } catch (e) {
      console.error("[getQueryFn] Error getting Firebase ID token:", e);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = queryKey[0] as string;
    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const json = await res.json();
    
    // Transform the response before returning
    return transformApiResponse(url, json);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
