import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Sun, Moon, Upload, Download, Info, User } from "lucide-react";
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
// Temporarily disable UserProfileButton due to auth context issues
// import UserProfileButton from "./UserProfileButton";
import AboutModal from "./AboutModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  toggleMobileMenu: () => void;
}

export default function Header({ toggleMobileMenu }: HeaderProps) {
  // Temporarily use local state for theme while fixing context
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Managing dialog states
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [importExportDialogOpen, setImportExportDialogOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  
  const openCreateModal = () => {
    setSnippetDialogOpen(true);
  };
  
  const openImportModal = () => {
    setImportExportDialogOpen(true);
  };

  const openAboutModal = () => {
    setAboutModalOpen(true);
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
            onClick={openAboutModal}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md"
            aria-label="About CodePatchwork"
          >
            <Info className="h-6 w-6" />
          </button>
          
          {/* Add Snippet Dialog - This is the single place to add new snippets */}
          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-2">
            <GlobalCodeThemeSelector />
            <AddSnippetDialog />
            
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
                <DropdownMenuItem onClick={openImportModal}>
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
              onClick={openCreateModal}
              className="flex items-center"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
            
            <Button 
              onClick={openImportModal}
              variant="outline"
              size="icon"
              className="h-9 w-9"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Temporarily replace UserProfileButton with a placeholder */}
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Button>
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
}
