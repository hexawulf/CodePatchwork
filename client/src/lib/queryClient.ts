import { QueryClient, type QueryFunction, type QueryKey } from "@tanstack/react-query";
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

/**
 * Resolve a TanStack Query key into a request URL.
 * Supports single URL keys (["/api/snippets?tag=go"]) and segmented path keys
 * (["/api/collections", 12, "snippets"] -> "/api/collections/12/snippets").
 */
export function buildQueryUrl(queryKey: QueryKey): string {
  const segments = queryKey
    .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
    .map((part, idx) => (idx === 0 ? String(part).replace(/\/+$/, "") : encodeURIComponent(String(part))));
  return segments.join("/");
}

/** Invalidate all snippet list/filtered/metadata queries. */
export function invalidateSnippetQueries(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({
    predicate: (query) => {
      const first = query.queryKey[0];
      return (
        typeof first === "string" &&
        (first.startsWith("/api/snippets") ||
          first.startsWith("/api/public/snippets") ||
          first === "/api/languages" ||
          first === "/api/tags")
      );
    },
  });
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
  data?: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {};
  if (data !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (options.expectJson === false || res.status === 204) {
    await throwIfResNotOk(res);
    return undefined as T;
  }

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `API error: ${res.status}`);
    }
    return json as T;
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  }
  throw new Error("Unexpected non-JSON response: " + text.slice(0, 200));
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>({
  on401: unauthorizedBehavior,
}: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    const token = await getAuthToken();

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = buildQueryUrl(queryKey);
    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };
}

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
