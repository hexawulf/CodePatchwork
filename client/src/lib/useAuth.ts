// client/src/lib/useAuth.ts
import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth, googleProvider, checkFirebaseAuth } from "./firebase";

interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper to detect network issues
const testApiConnectivity = async (url: string): Promise<boolean> => {
  try {
    console.log(`[useAuth] Testing API connectivity to: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log(`[useAuth] API connectivity test result: ${response.status}`);
      return response.ok;
    } catch (e) {
      clearTimeout(timeoutId);
      console.error(`[useAuth] API connectivity test failed:`, e);
      return false;
    }
  } catch (e) {
    console.error(`[useAuth] Error in API connectivity test:`, e);
    return false;
  }
};

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Add debug function to inspect current auth state
  const debugAuthState = () => {
    console.log("[useAuth DEBUG] Current auth state:", {
      user: user ? { ...user } : null,
      loading,
      networkError
    });
  };

  // Special debug function to directly test connectivity and auth state
  const diagnoseAuthIssues = async () => {
    console.log("[useAuth] Running authentication diagnosis...");
    
    // 1. Check if we can reach the API server
    const apiConnected = await testApiConnectivity('/api/health');
    console.log(`[useAuth] API server connectivity: ${apiConnected ? 'OK' : 'FAILED'}`);
    
    // 2. Check direct Firebase auth state
    const firebaseAuth = await checkFirebaseAuth();
    console.log(`[useAuth] Firebase direct auth check:`, firebaseAuth);
    
    // 3. Try manual token retrieval if user exists
    if (firebaseAuth.user) {
      try {
        console.log("[useAuth] Attempting manual token retrieval and API call");
        const token = await firebaseAuth.user.getIdToken(true);
        
        try {
          const res = await fetch("/api/auth/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });
          
          console.log(`[useAuth] Manual API call result: ${res.status}`);
          
          if (res.ok) {
            const appUser: AppUser = await res.json();
            console.log("[useAuth] Manual API call succeeded:", appUser);
            console.log("[useAuth] Updating user state manually");
            setUser(appUser);
            return true;
          } else {
            console.error("[useAuth] Manual API call failed:", await res.text());
          }
        } catch (e) {
          console.error("[useAuth] Manual API call error:", e);
        }
      } catch (e) {
        console.error("[useAuth] Manual token retrieval failed:", e);
      }
    }
    
    return false;
  };

  useEffect(() => {
    console.log("[useAuth] registering onAuthStateChanged listener");
    // IMPORTANT: Clear any reload flags to break the loop
    sessionStorage.removeItem("auth_success");
    
    // Network connectivity check
    testApiConnectivity('/api/health').then(connected => {
      if (!connected) {
        console.error("[useAuth] ⚠️ Cannot connect to API server! Check network or server status.");
        setNetworkError("Cannot connect to API server. Check your internet connection.");
      } else {
        console.log("[useAuth] API server connectivity test passed");
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("[useAuth] onAuthStateChanged → ", fbUser);
      
      if (fbUser) {
        try {
          console.log("[useAuth] Firebase user exists, getting ID token");
          const idToken = await fbUser.getIdToken(true);
          console.log("[useAuth] got ID token, length:", idToken.length);
          console.log("[useAuth] Preparing to POST /api/auth/user");
          
          try {
            const res = await fetch("/api/auth/user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
            
            console.log("[useAuth] /api/auth/user response status:", res.status);
            
            if (res.ok) {
              const appUser: AppUser = await res.json();
              console.log("[useAuth] server returned AppUser:", appUser);
              console.log("[useAuth] Setting user state...");
              // Set user state directly, no reload
              setUser(appUser);
              setNetworkError(null); // Clear any network errors
            } else {
              const errorText = await res.text();
              console.error("[useAuth] /api/auth/user failed:", res.status, errorText);
              setUser(null);
              
              // Handle specific error statuses
              if (res.status === 401) {
                console.error("[useAuth] Authentication token rejected by server");
                // Try token refresh and retry once
                try {
                  console.log("[useAuth] Attempting token refresh and retry");
                  const freshToken = await fbUser.getIdToken(true);
                  const retryRes = await fetch("/api/auth/user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken: freshToken }),
                  });
                  
                  if (retryRes.ok) {
                    const appUser: AppUser = await retryRes.json();
                    console.log("[useAuth] Retry succeeded, setting user");
                    setUser(appUser);
                  } else {
                    console.error("[useAuth] Retry failed:", await retryRes.text());
                  }
                } catch (e) {
                  console.error("[useAuth] Token refresh and retry failed:", e);
                }
              } else if (res.status >= 500) {
                // Server error
                setNetworkError("Server error. Please try again later.");
              } else if (res.status === 0 || res.status === 404) {
                // Network connectivity issue
                setNetworkError("Cannot connect to server. Check your internet connection.");
              }
            }
          } catch (e) {
            console.error("[useAuth] Network error contacting API server:", e);
            setNetworkError("Network error. Please check your internet connection.");
            setUser(null);
          }
        } catch (e) {
          console.error("[useAuth] error fetching ID token:", e);
          setUser(null);
        }
      } else {
        console.log("[useAuth] no firebase user, clearing local user");
        setUser(null);
      }
      
      setLoading(false);
    });

    // If URL contains the bypass flag, try direct diagnosis
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('diagnose_auth')) {
      console.log("[useAuth] Auth diagnosis requested via URL parameter");
      setTimeout(() => {
        diagnoseAuthIssues();
      }, 2000);
    }

    // Expose diagnosis function globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).__diagnoseAuth = diagnoseAuthIssues;
      console.log("[useAuth] Added global debug function: __diagnoseAuth");
    }

    return () => {
      console.log("[useAuth] cleaning up listener");
      unsubscribe();
    };
  }, []);

  const signIn = async () => {
    console.log("[useAuth] signIn() called");
    setLoading(true);
    
    try {
      console.log("[useAuth] Attempting signInWithPopup");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("[useAuth] signInWithPopup successful, user:", result.user);
      
      // Try to immediately fetch the token and make API call
      try {
        const idToken = await result.user.getIdToken();
        console.log("[useAuth] Got token after sign-in, making immediate API call");
        
        const res = await fetch("/api/auth/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        
        if (res.ok) {
          const appUser: AppUser = await res.json();
          console.log("[useAuth] Immediate API call succeeded, setting user directly");
          setUser(appUser);
          setNetworkError(null);
        } else {
          console.error("[useAuth] Immediate API call failed:", res.status);
        }
      } catch (e) {
        console.error("[useAuth] Error making immediate API call:", e);
      }
    } catch (err: any) {
      console.error("[useAuth] signInWithPopup error:", err.code, err.message);
      
      // Handle specific auth errors
      if (err.code === 'auth/popup-closed-by-user') {
        console.log("[useAuth] Popup closed by user - normal flow");
      } else if (err.code === 'auth/popup-blocked') {
        console.error("[useAuth] Popup was blocked by browser");
        setNetworkError("Sign-in popup was blocked. Please allow popups for this site.");
      } else if (err.code === 'auth/network-request-failed') {
        console.error("[useAuth] Network error during authentication");
        setNetworkError("Network error during sign-in. Please check your internet connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log("[useAuth] logout() called");
    setLoading(true);
    try {
      await signOut(auth);
      console.log("[useAuth] Sign out successful");
      setUser(null);
    } catch (err) {
      console.error("[useAuth] Sign out error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Keep old method name for backward compatibility
  const logOut = logout;

  // Add support for showing notifications
  const showNotification = (title: string, type: string, message?: string): void => {
    console.log(`[useAuth] Notification: ${title} (${type})`, message);
    
    // Only implement if we need to show notifications outside of toast system
    // For now, just log and don't display anything since your app uses toast
  };
  
  // Additional property to match AuthContext
  const isAuthenticated = !!user;

  return { 
    user, 
    loading, 
    signIn, 
    logOut, 
    logout, // Add new name for consistency
    signOut: logout, // Add alias for consistency with AuthContext
    networkError,
    diagnoseAuthIssues,
    debugAuthState,
    isAuthenticated, // Add this property to match AuthContext
    showNotification, // Add notification function to match AuthContext
    currentUser: user // Add alias to match old UserProfileButton expectations
  };
}
