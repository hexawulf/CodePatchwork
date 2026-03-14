import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken(true);
          const res = await fetch("/api/auth/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          if (res.ok) {
            const appUser: AppUser = await res.json();
            setUser(appUser);
          } else {
            console.error("[useAuth] /api/auth/user failed:", res.status);
            setUser(null);
          }
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

  const signIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch("/api/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const appUser: AppUser = await res.json();
        setUser(appUser);
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        // Normal flow, user cancelled
      } else {
        console.error("[useAuth] signIn error:", err.code, err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error("[useAuth] signOut error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, signIn, signOut, isAuthenticated: !!user };
}
