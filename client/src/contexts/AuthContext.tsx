// client/src/contexts/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";

interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  showNotification: (title: string, type: string, message?: string) => void;
  isAuthenticated: boolean;
}

// Custom event for auth state changes within the same tab
const AUTH_STATE_CHANGE_EVENT = 'auth_state_change';

// Create a function to dispatch the auth state change event
const dispatchAuthStateChangeEvent = () => {
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT));
};

// Keep the same undefined context pattern you're using
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Get the authentication state from useAuth
  const authState = useAuth();
  
  // Create a stable state with proper initialization from localStorage
  const [stableState, setStableState] = useState(() => {
    // Try to initialize from localStorage on first render
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("[AuthContext] Initialized from localStorage:", parsedUser.email);
        return {
          ...authState,
          user: parsedUser,
          isAuthenticated: true
        };
      }
    } catch (e) {
      console.error("[AuthContext] localStorage error during initialization:", e);
    }
    
    // Fall back to authState if no valid localStorage data
    return authState;
  });
  
  // This effect ensures we update our state when auth changes
  useEffect(() => {
    console.log("[AuthContext] Auth state from useAuth:", {
      user: authState.user ? { 
        id: authState.user.id,
        email: authState.user.email,
        displayName: authState.user.displayName
      } : null,
      loading: authState.loading
    });
    
    // Only update state if something meaningful changed
    if (
      authState.loading !== stableState.loading ||
      authState.user?.id !== stableState.user?.id
    ) {
      console.log("[AuthContext] Updating stable state with new auth state");
      setStableState(prev => ({
        ...prev,
        ...authState,
        isAuthenticated: !!authState.user
      }));
    }
  }, [authState.user, authState.loading]);
  
  // Check for localStorage backup on mount and changes
  useEffect(() => {
    try {
      // If we have a user, save to localStorage as backup
      if (stableState.user) {
        localStorage.setItem('auth_user', JSON.stringify(stableState.user));
        console.log("[AuthContext] Saved current user to localStorage");
        // Dispatch custom event to notify other components
        dispatchAuthStateChangeEvent();
      } else {
        // If we don't have a user, check if we should remove from localStorage
        if (localStorage.getItem('auth_user')) {
          console.log("[AuthContext] No user in state but found in localStorage, checking if we should clear");
          // Only clear if we're not loading, to avoid race conditions
          if (!stableState.loading) {
            console.log("[AuthContext] State is not loading, clearing localStorage user");
            localStorage.removeItem('auth_user');
            // Dispatch custom event to notify other components
            dispatchAuthStateChangeEvent();
          }
        }
      }
    } catch (e) {
      console.error("[AuthContext] localStorage error:", e);
    }
  }, [stableState.user, stableState.loading]);

  // NEW: Add a listener for localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user') {
        console.log("[AuthContext] auth_user localStorage change detected");
        try {
          if (e.newValue) {
            const parsedUser = JSON.parse(e.newValue);
            console.log("[AuthContext] Updated user from storage event:", parsedUser.email);
            setStableState(prev => ({
              ...prev,
              user: parsedUser,
              isAuthenticated: true
            }));
          } else {
            console.log("[AuthContext] User removed from localStorage in another tab");
            setStableState(prev => ({
              ...prev,
              user: null,
              isAuthenticated: false
            }));
          }
        } catch (error) {
          console.error("[AuthContext] Error parsing localStorage data:", error);
        }
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // NEW: Add listener for custom auth state change events (within same tab)
  useEffect(() => {
    const handleAuthStateChange = () => {
      console.log("[AuthContext] Auth state change event received");
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("[AuthContext] Updated user from custom event:", parsedUser.email);
          
          // Only update if there's an actual change
          if (JSON.stringify(parsedUser) !== JSON.stringify(stableState.user)) {
            setStableState(prev => ({
              ...prev,
              user: parsedUser,
              isAuthenticated: true
            }));
          }
        } else if (stableState.user) {
          console.log("[AuthContext] User removed from localStorage");
          setStableState(prev => ({
            ...prev,
            user: null,
            isAuthenticated: false
          }));
        }
      } catch (error) {
        console.error("[AuthContext] Error handling auth state change event:", error);
      }
    };

    // Add event listener for our custom event
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    };
  }, [stableState.user]);

  // Function to sign out the user
  const signOut = async (): Promise<void> => {
    console.log("[AuthContext] signOut called");
    try {
      // Check which logout function exists and use it
      if (typeof authState.signOut === 'function') {
        console.log("[AuthContext] Using authState.signOut");
        await authState.signOut();
      } else if (typeof authState.logOut === 'function') {
        console.log("[AuthContext] Using authState.logOut");
        await authState.logOut();
      } else if (typeof authState.logout === 'function') {
        console.log("[AuthContext] Using authState.logout");
        await authState.logout();
      } else {
        // Fallback if not provided by useAuth
        console.log("[AuthContext] No logout method found in authState, using fallback");
        // Remove from localStorage
        localStorage.removeItem('auth_user');
        // Dispatch the event to update all components
        dispatchAuthStateChangeEvent();
        // Update state
        setStableState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false
        }));
      }
      showNotification("Signed out successfully", "info");
    } catch (error: any) {
      console.error("[AuthContext] Error signing out:", error);
      showNotification("Error signing out", "error", error.message);
    }
  };

  // Function to show notifications
  const showNotification = (title: string, type: string, message?: string): void => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    
    // Set icon based on type
    let icon = '✓';
    let color = '#4caf50'; // success/green
    
    if (type === 'error') {
      icon = '✕';
      color = '#f44336'; // error/red
    } else if (type === 'info') {
      icon = 'ℹ';
      color = '#2196f3'; // info/blue
    } else if (type === 'warning') {
      icon = '⚠';
      color = '#ff9800'; // warning/orange
    }
    
    // Create notification content
    notification.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="margin-right: 10px;">${icon}</div>
        <div>
          <div style="font-weight: bold;">${title}</div>
          ${message ? `<div style="font-size: 12px;">${message}</div>` : ''}
        </div>
      </div>
    `;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = color;
    notification.style.color = '#fff';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  };

  // NEW: Add a force refresh function to explicitly update from localStorage
  const forceRefreshFromStorage = () => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("[AuthContext] Force refreshed from localStorage:", parsedUser.email);
        setStableState(prev => ({
          ...prev,
          user: parsedUser,
          isAuthenticated: true
        }));
        return true;
      } else if (stableState.user) {
        console.log("[AuthContext] Force refresh found no user in localStorage, clearing state");
        setStableState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false
        }));
      }
    } catch (e) {
      console.error("[AuthContext] Force refresh localStorage error:", e);
    }
    return false;
  };

  // Make sure signIn is always available
  const signIn = async () => {
    if (typeof authState.signIn === 'function') {
      console.log("[AuthContext] Using authState.signIn");
      await authState.signIn();
      
      // After sign-in, force a refresh from localStorage to ensure state is updated
      setTimeout(() => {
        forceRefreshFromStorage();
      }, 1000);
    } else {
      console.log("[AuthContext] Default signIn called, but no implementation provided");
      showNotification("Sign-in not implemented", "error", "The sign-in function is not available.");
    }
  };

  // Additional debugging render information
  console.log("[AuthContext] Rendering with state:", {
    hasUser: !!stableState.user,
    userEmail: stableState.user?.email,
    isLoading: stableState.loading,
    isAuthenticated: !!stableState.user || stableState.isAuthenticated
  });

  // Create an enhanced value object with our added functions
  const enhancedValue: AuthContextType = {
    user: stableState.user,
    loading: stableState.loading,
    signIn,
    signOut,
    showNotification,
    isAuthenticated: !!stableState.user
  };

  return (
    <AuthContext.Provider value={enhancedValue}>
      {children}
    </AuthContext.Provider>
  );
}

// NEW: Create a function to force a refresh of auth state from any component
export function refreshAuthState() {
  dispatchAuthStateChangeEvent();
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  
  // Add debugging when context is accessed
  if (ctx) {
    console.log("[useAuthContext] Context accessed:", {
      hasUser: !!ctx.user,
      userEmail: ctx.user?.email,
      isLoading: ctx.loading,
      isAuthenticated: ctx.isAuthenticated
    });
  } else {
    console.error("[useAuthContext] Context is undefined - not within provider!");
  }
  
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

// Export the custom event name and dispatch function for components to use
export { AUTH_STATE_CHANGE_EVENT, dispatchAuthStateChangeEvent };

// Re-export useAuth from lib for components that expect it from AuthContext
export { useAuth } from '@/lib/useAuth';
