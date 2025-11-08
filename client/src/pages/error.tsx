import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
  message?: string;
}

export default function ErrorPage({ message = "Something went wrong" }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-slate-900">
      <div className="text-center space-y-6 p-8 max-w-lg">
        <div className="space-y-2">
          <AlertTriangle className="h-20 w-20 text-red-500 mx-auto" />
          <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100">Error</h1>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Oops! Something went wrong</h2>
          <p className="text-slate-600 dark:text-slate-400">
            {message}
          </p>
        </div>
        
        <div className="flex gap-4 justify-center pt-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
