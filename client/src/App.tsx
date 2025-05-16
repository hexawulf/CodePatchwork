import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SnippetProvider } from "@/contexts/SnippetContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Snippets from "@/pages/Snippets";
import Collections from "@/pages/Collections";
import Tags from "@/pages/Tags";
import Settings from "@/pages/Settings";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/snippets" component={Snippets} />
      <Route path="/collections" component={Collections} />
      <Route path="/tags" component={Tags} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Get theme from document.documentElement class list
  useEffect(() => {
    // Check for system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SnippetProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SnippetProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
