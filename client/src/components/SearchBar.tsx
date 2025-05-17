import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { debounce } from "@/lib/utils";
import { useSnippetContext } from "@/contexts/SnippetContext";

export default function SearchBar() {
  // Use the global snippet context for search
  const { searchTerm, setSearchTerm } = useSnippetContext();
  const [inputValue, setInputValue] = useState(searchTerm || "");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Update search term with proper debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new debounce timeout
    const newTimeout = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
    
    setSearchTimeout(newTimeout);
  };
  
  // Handle Enter key press for immediate search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Immediately apply the search without waiting for debounce
      setSearchTerm(inputValue);
      
      // Clear any pending timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        setSearchTimeout(null);
      }
    }
  };

  // Update input value when searchTerm changes externally
  useEffect(() => {
    setInputValue(searchTerm || "");
  }, [searchTerm]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="relative">
      <input 
        type="text" 
        placeholder="Search snippets..." 
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full py-2 pl-10 pr-4 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
      />
      <div className="absolute left-3 top-2.5 text-slate-400">
        <Search className="h-5 w-5" />
      </div>
    </div>
  );
}
