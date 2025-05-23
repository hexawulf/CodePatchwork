// client/src/App.tsx

import React, { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CodeThemeProvider } from "@/contexts/CodeThemeContext";
import { SnippetProvider } from "@/contexts/SnippetContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { useAuthContext } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Snippets from "@/pages/Snippets";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import Tags from "@/pages/Tags";
import Settings from "@/pages/Settings";
import SharedSnippet from "@/pages/SharedSnippet";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/snippets" component={Snippets} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections/:id" component={CollectionDetail} />
      <Route path="/tags" component={Tags} />
      <Route path="/settings" component={Settings} />
      <Route path="/shared/:shareId" component={SharedSnippet} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Added debug component to show authentication state
function AuthDebug({ user, loading }: { user: any, loading: boolean }) {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded text-xs opacity-80 z-50">
      <div>Auth Status: {loading ? "Loading" : user ? "Authenticated" : "Not Authenticated"}</div>
      {user && (
        <div>
          User: {user.email || "No email"}<br />
          ID: {user.id?.substring(0, 8) || "No ID"}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { user, loading, signIn } = useAuthContext();
  const [showDebug, setShowDebug] = useState(false);

  // Add explicit debugging to track auth state
  useEffect(() => {
    console.log("[App] Auth state in App.tsx:", { 
      user: user ? { id: user.id, email: user.email } : null, 
      loading 
    });
    console.log("[App] Is user null?", user === null);
    console.log("[App] Authentication state:", loading ? "loading" : user ? "authenticated" : "not authenticated");
  }, [user, loading]);

  // Apply your theme class once on mount
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);

    // Toggle debug panel with key press (Alt+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Try to restore from localStorage if no user but we have a saved one
  useEffect(() => {
    if (!loading && !user) {
      try {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          console.log("[App] Found saved user in localStorage, but not reflected in context");
        }
      } catch (e) {
        console.error("[App] localStorage error:", e);
      }
    }
  }, [user, loading]);

  // 1) Still waiting for Firebase → show spinner or placeholder
  if (loading) {
    console.log("[App] Currently loading, showing loading state");
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="mb-4">Loading authentication...</div>
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
        {showDebug && <AuthDebug user={user} loading={loading} />}
      </div>
    );
  }

  // 2) Not signed in → show Google button
  if (!user) {
    console.log("[App] No user detected, showing login button");
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-2">CodePatchwork</h1>
          <p>Please sign in to access your snippets</p>
        </div>
        <button
          onClick={() => {
            console.log("[App] Sign in button clicked");
            signIn();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign in with Google
        </button>
        {showDebug && <AuthDebug user={user} loading={loading} />}
      </div>
    );
  }

  // 3) Signed in → render the full app
  console.log("[App] User authenticated, rendering full app:", user);
  return (
    <ThemeProvider>
      <CodeThemeProvider>
        <SnippetProvider>
          <CollectionProvider>
            <TooltipProvider>
              <Router />
              {showDebug && <AuthDebug user={user} loading={loading} />}
            </TooltipProvider>
          </CollectionProvider>
        </SnippetProvider>
      </CodeThemeProvider>
    </ThemeProvider>
  );
}
