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

function transformCollection(collection: any) {
  if (!collection) return collection;
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    userId: collection.userid ?? collection.userId,
    createdAt: collection.createdat ?? collection.createdAt,
    updatedAt: collection.updatedat ?? collection.updatedAt,
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
    userId: snippet.userid ?? snippet.userId,
    createdAt: snippet.createdat ?? snippet.createdAt,
    updatedAt: snippet.updatedat ?? snippet.updatedAt,
    viewCount: snippet.viewcount ?? snippet.viewCount ?? 0,
    isFavorite: snippet.isfavorite ?? snippet.isFavorite ?? false,
    shareId: snippet.shareid ?? snippet.shareId ?? null,
    isPublic: snippet.ispublic ?? snippet.isPublic ?? false,
  };
}

function transformComment(comment: any) {
  if (!comment) return comment;
  return {
    id: comment.id,
    snippetId: comment.snippetid ?? comment.snippetId,
    content: comment.content,
    userId: comment.userid ?? comment.userId,
    createdAt: comment.createdat ?? comment.createdAt,
    updatedAt: comment.updatedat ?? comment.updatedAt,
  };
}

function transformApiResponse(url: string, data: any) {
  if (!data) return data;

  if (Array.isArray(data)) {
    if (url.includes("/collections")) return data.map(transformCollection);
    if (url.includes("/snippets")) return data.map(transformSnippet);
    if (url.includes("/comments")) return data.map(transformComment);
    return data;
  }

  if (url.includes("/collections")) return transformCollection(data);
  if (url.includes("/snippets")) return transformSnippet(data);
  if (url.includes("/comments")) return transformComment(data);
  return data;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
  } catch {
    // Token retrieval failed, continue unauthenticated
  }
  return null;
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (options.expectJson === false || res.status === 204) {
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    return undefined as T;
  }

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `API error: ${res.status}`);
    }
    return transformApiResponse(url, json);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  }
  const text = await res.text();
  throw new Error("Unexpected non-JSON response: " + text.slice(0, 200));
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = await getAuthToken();

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

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
