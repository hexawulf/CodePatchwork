// client/src/components/Header.tsx
import { useEffect, useState, useRef } from "react";
import { useAuthContext, AUTH_STATE_CHANGE_EVENT } from "@/contexts/AuthContext";
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
import { useSnippetContext } from "@/contexts/SnippetContext";

interface HeaderProps {
  toggleMobileMenu?: () => void;
}

const Header = ({ toggleMobileMenu }: HeaderProps = {}) => {
  // Auth context for authentication state
  const { user, isAuthenticated, signIn, signOut } = useAuthContext();
  
  // Theme context
  const { theme, toggleTheme } = useTheme();
  
  // Snippet context
  const { openCreateModal } = useSnippetContext();
  
  // State for forcing auth updates
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Managing dialog states
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [importExportDialogOpen, setImportExportDialogOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  
  // For user dropdown menu
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  
  // Listen for auth state changes and force re-render
  useEffect(() => {
    console.log("[Header] Component mounted with auth state:", { isAuthenticated, email: user?.email });
    
    // Function to handle auth state changes
    const handleAuthChange = () => {
      console.log("[Header] Auth state change detected, forcing update");
      setForceUpdate(prev => prev + 1);
    };
    
    // Listen for our custom auth state change event
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthChange);
    
    // Also listen for storage events (for changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user') {
        console.log("[Header] auth_user changed in localStorage, forcing update");
        setForceUpdate(prev => prev + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Handle clicks outside of dropdown to close it
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, isAuthenticated]);
  
  // Helper function to handle snippet dialog opening
  const handleOpenSnippetDialog = () => {
    setSnippetDialogOpen(true);
  };
  
  // Helper function to handle import/export dialog opening
  const handleOpenImportExport = () => {
    setImportExportDialogOpen(true);
  };
  
  // Helper function to handle about modal opening
  const handleOpenAboutModal = () => {
    setAboutModalOpen(true);
  };
  
  // Helper function to toggle user dropdown
  const handleUserDropdownToggle = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };
  
  // Helper function to handle logout
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
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
          </button>
          
          {/* About button */}
          <button
            type="button"
            onClick={handleOpenAboutModal}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md"
            aria-label="About CodePatchwork"
          >
            <Info className="h-6 w-6" />
          </button>
          
          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-2">
            <GlobalCodeThemeSelector />
            
            <Button 
              size="sm"
              onClick={handleOpenSnippetDialog}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>New Snippet</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Import/Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenImportExport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Snippets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = "/api/snippets/export"}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Snippets
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Mobile actions */}
          <div className="md:hidden flex items-center space-x-2">
            <GlobalCodeThemeSelector />
            
            <Button 
              onClick={handleOpenSnippetDialog}
              className="flex items-center"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
            
            <Button 
              onClick={handleOpenImportExport}
              variant="outline"
              size="icon"
              className="h-9 w-9"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Auth buttons section */}
          <div className="relative" ref={userDropdownRef}>
            {isAuthenticated ? (
              // User is logged in - show avatar with dropdown
              <>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full"
                  onClick={handleUserDropdownToggle}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {user?.email ? user.email[0].toUpperCase() : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
                
                {/* User dropdown menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50">
                    <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {user?.email}
                    </div>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              // User is not logged in - show login button
              <Button 
                size="sm"
                onClick={signIn}
                className="flex items-center gap-1"
              >
                <User className="h-4 w-4 mr-1" />
                Log In
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* Mobile search (appears below header on small screens) */}
      <div className="md:hidden p-2 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700">
        <SearchBar />
      </div>
      
      {/* Mobile AddSnippetDialog - controlled by mobile button */}
      <AddSnippetDialog open={snippetDialogOpen} onOpenChange={setSnippetDialogOpen} />
      
      {/* Import/Export Dialog */}
      <ImportExportDialog open={importExportDialogOpen} onOpenChange={setImportExportDialogOpen} />
      
      {/* About Modal */}
      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
    </>
  );
};

export default Header;
