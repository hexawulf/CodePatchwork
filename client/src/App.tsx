// client/src/App.tsx

import React, { useEffect, useState } from "react";
import { Redirect, Switch, Route } from "wouter"; // Added Redirect
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CodeThemeProvider } from "@/contexts/CodeThemeContext";
import { SnippetProvider } from "@/contexts/SnippetContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { useAuthContext } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home"; // This is the authenticated dashboard
import PublicHome from '@/pages/PublicHome';
import Snippets from "@/pages/Snippets";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import Tags from "@/pages/Tags";
import Settings from "@/pages/Settings";
import SharedSnippet from "@/pages/SharedSnippet";

// Renamed from Router to AuthenticatedRouter
function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} /> {/* Authenticated home/dashboard */}
      <Route path="/snippets" component={Snippets} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections/:id" component={CollectionDetail} />
      <Route path="/tags" component={Tags} />
      <Route path="/settings" component={Settings} />
      <Route path="/shared/:shareId" component={SharedSnippet} />
      <Route path="/login"><Redirect to="/" /></Route> {/* Added for authenticated users */}
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={PublicHome} />
      <Route path="/login" component={SignInTriggerPage} /> {/* Added for unauthenticated users */}
      <Route path="/shared/:shareId" component={SharedSnippet} />
      {/* For non-matched routes, redirect to PublicHome */}
      <Route component={PublicHome} />
    </Switch>
  );
}

// SignInTriggerPage Helper Component
const SignInTriggerPage: React.FC = () => {
  const { signIn, user, loading } = useAuthContext(); // useAuthContext is already imported
  useEffect(() => {
    // Only attempt to sign in if not already authenticated and not loading
    if (!user && !loading) {
      signIn();
    }
  }, [signIn, user, loading]);

  // If already logged in (e.g., due to fast auth resolution), redirect to home.
  if (user) {
    return <Redirect to="/" />;
  }
  // If still loading auth state
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="mb-4">Loading authentication...</div>
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }
  // Default state while sign-in is being triggered or if user backs out of Google prompt
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <p>Redirecting to sign-in...</p>
      {/* Or redirect to PublicHome if sign-in is not immediate / user needs to click again */}
      {/* For now, this message is fine as signIn() should overlay Google prompt */}
    </div>
  );
};

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
  const { user, loading } = useAuthContext(); // Removed signIn from here as it's not used directly for button anymore
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

  // 2) Routing logic based on authentication state
  // PublicHome will now handle the sign-in prompt.
  console.log(`[App] Rendering routers. User: ${user ? user.id : 'null'}, Loading: ${loading}`);
  return (
    <ThemeProvider>
      <CodeThemeProvider>
        <SnippetProvider> {/* SnippetProvider might be needed by SharedSnippet too */}
          <CollectionProvider> {/* CollectionProvider might be needed by SharedSnippet too */}
            <TooltipProvider>
              {user ? <AuthenticatedRouter /> : <PublicRouter />}
              {showDebug && <AuthDebug user={user} loading={loading} />}
            </TooltipProvider>
          </CollectionProvider>
        </SnippetProvider>
      </CodeThemeProvider>
    </ThemeProvider>
  );
}