import { useEffect, useState, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Menu, Plus, Sun, Moon, Upload, Download, Info, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SearchBar from "./SearchBar";
import AddSnippetDialog from "./AddSnippetDialog";
import ImportExportDialog from "./ImportExportDialog";
import GlobalCodeThemeSelector from "./GlobalCodeThemeSelector";
import AboutModal from "./AboutModal";
import { downloadSnippetsExport } from "@/lib/exportSnippets";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  toggleMobileMenu?: () => void;
}

const Header = ({ toggleMobileMenu }: HeaderProps = {}) => {
  const { user, isAuthenticated, signIn, signOut } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [importExportDialogOpen, setImportExportDialogOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async () => {
    try {
      const count = await downloadSnippetsExport();
      toast({ title: "Snippets exported", description: `${count} snippets saved to a JSON file.` });
    } catch (err: unknown) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not export snippets.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUserDropdownOpen(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700 py-3 px-4 flex justify-between items-center">
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-2 font-semibold text-slate-800 dark:text-white">CodePatchwork</span>
        </div>

        <div className="max-w-lg w-full hidden md:block">
          <SearchBar />
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={() => setAboutModalOpen(true)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md"
            aria-label="About CodePatchwork"
          >
            <Info className="h-6 w-6" />
          </button>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-2">
            <GlobalCodeThemeSelector />

            <Button size="sm" onClick={() => setSnippetDialogOpen(true)} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>New Snippet</span>
            </Button>

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
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Snippets
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center space-x-2">
            <GlobalCodeThemeSelector />

            <Button onClick={() => setSnippetDialogOpen(true)} className="flex items-center" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>

            <Button
              onClick={() => setImportExportDialogOpen(true)}
              variant="outline"
              size="icon"
              className="h-9 w-9"
              aria-label="Import or export snippets"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Auth section */}
          <div className="relative" ref={userDropdownRef}>
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  aria-label="User menu"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {user?.email ? user.email[0].toUpperCase() : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50">
                    <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {user?.email}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Button size="sm" onClick={signIn} className="flex items-center gap-1">
                <User className="h-4 w-4 mr-1" />
                Log In
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="md:hidden p-2 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700">
        <SearchBar />
      </div>

      {snippetDialogOpen && (
        <AddSnippetDialog open={snippetDialogOpen} onOpenChange={setSnippetDialogOpen} />
      )}
      {importExportDialogOpen && (
        <ImportExportDialog open={importExportDialogOpen} onOpenChange={setImportExportDialogOpen} />
      )}
      {aboutModalOpen && (
        <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
      )}
    </>
  );
};

export default Header;
