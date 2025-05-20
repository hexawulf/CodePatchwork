// client/src/lib/useAuth.ts

import { useState, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[useAuth] registering onAuthStateChanged listener");
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("[useAuth] onAuthStateChanged → ", fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken(true);
          console.log("[useAuth] got ID token, POST /api/auth/user");
          const res = await fetch("/api/auth/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          if (res.ok) {
            const appUser: AppUser = await res.json();
            console.log("[useAuth] server returned AppUser:", appUser);
            setUser(appUser);
          } else {
            console.error("[useAuth] /api/auth/user failed:", res.status, await res.text());
            setUser(null);
          }
        } catch (e) {
          console.error("[useAuth] error fetching ID token or syncing:", e);
          setUser(null);
        }
      } else {
        console.log("[useAuth] no firebase user, clearing local user");
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log("[useAuth] cleaning up listener");
      unsubscribe();
    };
  }, []);

  const signIn = async () => {
    console.log("[useAuth] signIn() called");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      console.log("[useAuth] signInWithPopup resolved");
    } catch (err: any) {
      console.error("[useAuth] signInWithPopup error:", err.code, err.message);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, signIn };
}
