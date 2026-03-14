import React, { useEffect, lazy, Suspense } from "react";
import { Redirect, Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CodeThemeProvider } from "@/contexts/CodeThemeContext";
import { SnippetProvider } from "@/contexts/SnippetContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { useAuthContext } from "@/contexts/AuthContext";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const PublicHome = lazy(() => import("@/pages/PublicHome"));
const Snippets = lazy(() => import("@/pages/Snippets"));
const Collections = lazy(() => import("@/pages/Collections"));
const CollectionDetail = lazy(() => import("@/pages/CollectionDetail"));
const Tags = lazy(() => import("@/pages/Tags"));
const Settings = lazy(() => import("@/pages/Settings"));
const SharedSnippet = lazy(() => import("@/pages/SharedSnippet"));

const PageLoader = () => (
  <div className="h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
  </div>
);

function AuthenticatedRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/snippets" component={Snippets} />
        <Route path="/collections" component={Collections} />
        <Route path="/collections/:id" component={CollectionDetail} />
        <Route path="/tags" component={Tags} />
        <Route path="/settings" component={Settings} />
        <Route path="/shared/:shareId" component={SharedSnippet} />
        <Route path="/login"><Redirect to="/" /></Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function PublicRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={PublicHome} />
        <Route path="/login" component={SignInTriggerPage} />
        <Route path="/shared/:shareId" component={SharedSnippet} />
        <Route component={PublicHome} />
      </Switch>
    </Suspense>
  );
}

const SignInTriggerPage: React.FC = () => {
  const { signIn, user, loading } = useAuthContext();

  useEffect(() => {
    if (!user && !loading) {
      signIn();
    }
  }, [signIn, user, loading]);

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="mb-4">{loading ? "Loading authentication..." : "Redirecting to sign-in..."}</div>
      {loading && (
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
      )}
    </div>
  );
};

export default function App() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="mb-4">Loading...</div>
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <CodeThemeProvider>
        <SnippetProvider>
          <CollectionProvider>
            <TooltipProvider>
              {user ? <AuthenticatedRouter /> : <PublicRouter />}
            </TooltipProvider>
          </CollectionProvider>
        </SnippetProvider>
      </CodeThemeProvider>
    </ThemeProvider>
  );
}
