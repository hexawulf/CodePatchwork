import { auth } from "@/lib/firebase";

export function useAuthenticatedFetch() {
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      return fetch(url, { ...options, headers });
    }
    return fetch(url, options);
  };

  return { authenticatedFetch };
}
