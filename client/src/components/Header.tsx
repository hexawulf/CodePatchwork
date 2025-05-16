import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Plus, User, Sun, Moon } from "lucide-react";
import SearchBar from "./SearchBar";
import AddSnippetDialog from "./AddSnippetDialog";

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
  
  // Managing dialog state directly in header instead of separate button
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  
  const openCreateModal = () => {
    setSnippetDialogOpen(true);
    console.log("Open create modal clicked");
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
          <span className="ml-2 font-semibold text-slate-800 dark:text-white">CodeCanvas</span>
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
          
          {/* Add Snippet Dialog - This is the single place to add new snippets */}
          <div className="hidden md:block">
            <AddSnippetDialog />
          </div>
          
          {/* Mobile version of Add Snippet button */}
          <Button 
            onClick={openCreateModal}
            className="md:hidden flex items-center"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
          
          <div className="relative">
            <button 
              className="flex items-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              aria-label="User menu"
            >
              <span className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-medium text-white">
                JS
              </span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile search (appears below header on small screens) */}
      <div className="md:hidden p-2 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700">
        <SearchBar />
      </div>
      
      {/* Mobile AddSnippetDialog - controlled by mobile button */}
      <AddSnippetDialog open={snippetDialogOpen} onOpenChange={setSnippetDialogOpen} />
    </>
  );
}
