import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Plus,
  Sun,
  Moon,
  Upload,
  Download,
  Info,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchBar from "./SearchBar";
import AddSnippetDialog from "./AddSnippetDialog";
import ImportExportDialog from "./ImportExportDialog";
import GlobalCodeThemeSelector from "./GlobalCodeThemeSelector";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/* -------------  Firebase ---------------- */
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
/* ---------------------------------------- */

/* -------------  Lazy-load AboutModal ---- */
const AboutModal = lazy(() => import("./AboutModal"));
/* ---------------------------------------- */

interface HeaderProps {
  toggleMobileMenu: () => void;
}

export default function Header({ toggleMobileMenu }: HeaderProps) {
  /* theme toggle */
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  /* dialog state */
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [importExportDialogOpen, setImportExportDialogOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  /* login */
  const handleLogin = async () => {
    console.log("🚀 login clicked");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("auth error", e.code, e.message);
      alert(e.message); // remove once stable
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700 py-3 px-4 flex justify-between items-center">
        {/* mobile logo / burger */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-2 font-semibold text-slate-800 dark:text-white">
            CodePatchwork
          </span>
        </div>

        {/* desktop search */}
        <div className="max-w-lg w-full hidden md:block">
          <SearchBar />
        </div>

        {/* right-hand controls */}
        <div className="flex items-center space-x-4">
          {/* theme */}
          <button
            type="button"
            onClick={toggleTheme}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>

          {/* about */}
          <button
            type="button"
            onClick={() => setAboutModalOpen(true)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md"
            aria-label="About CodePatchwork"
          >
            <Info className="h-6 w-6" />
          </button>

          {/* desktop extras */}
          <div className="hidden md:flex items-center space-x-2">
            <GlobalCodeThemeSelector />
            <AddSnippetDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  Import/Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setImportExportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Snippets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => (window.location.href = "/api/snippets/export")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Snippets
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* mobile actions */}
          <div className="md:hidden flex items-center space-x-2">
            <GlobalCodeThemeSelector />
            <Button onClick={() => setSnippetDialogOpen(true)} size="sm" className="flex items-center">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
            <Button
              onClick={() => setImportExportDialogOpen(true)}
              variant="outline"
              size="icon"
              className="h-9 w-9"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* login / avatar */}
          <Button
            id="login-btn"
            onClick={handleLogin}
            variant="ghost"
            className="relative h-10 w-10 rounded-full"
            aria-label="Sign in"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </header>

      {/* mobile search bar */}
      <div className="md:hidden p-2 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700">
        <SearchBar />
      </div>

      {/* dialogs */}
      <AddSnippetDialog open={snippetDialogOpen} onOpenChange={setSnippetDialogOpen} />
      <ImportExportDialog open={importExportDialogOpen} onOpenChange={setImportExportDialogOpen} />

      {/* lazily-loaded About modal */}
      <Suspense fallback={null}>
        <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
      </Suspense>
    </>
  );
}

