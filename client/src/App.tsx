// client/src/App.tsx

import React, { useEffect } from "react";
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
import { DebugEnv } from "./components/Debug";

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

export default function App() {
  const { user, loading, signIn } = useAuthContext();

  // Apply your theme class once on mount
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // 1) Still waiting for Firebase → show spinner or placeholder
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading…</div>;
  }

  // 2) Not signed in → show Google button
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <button
          onClick={signIn}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // 3) Signed in → render the full app
  return (
    <ThemeProvider>
      <CodeThemeProvider>
        <SnippetProvider>
          <CollectionProvider>
            <TooltipProvider>
              <Router />
              <DebugEnv />
            </TooltipProvider>
          </CollectionProvider>
        </SnippetProvider>
      </CodeThemeProvider>
    </ThemeProvider>
  );
}
