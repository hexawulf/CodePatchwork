import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "@firebase/auth";
import { auth, googleProvider } from "./firebase";

export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
}

async function syncBackendUser(idToken: string): Promise<AppUser | null> {
  const res = await fetch("/api/auth/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    console.error("[useAuth] /api/auth/user failed:", res.status);
    return null;
  }
  return (await res.json()) as AppUser;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken(true);
          setUser(await syncBackendUser(idToken));
        } catch (e) {
          console.error("[useAuth] error during auth flow:", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      // onAuthStateChanged handles syncing the signed-in user with /api/auth/user
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code !== "auth/popup-closed-by-user") {
        console.error("[useAuth] signIn error:", fbErr.code, fbErr.message);
      }
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error("[useAuth] signOut error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, signIn, signOut, isAuthenticated: !!user };
}
