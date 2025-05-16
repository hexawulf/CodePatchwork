import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { debounce } from "@/lib/utils";

export default function SearchBar() {
  // Temporary local state for search while fixing context
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  
  // Debounce the search term update to prevent too many API calls
  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    [setSearchTerm]
  );
  
  // Update search term when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSetSearchTerm(value);
  };

  // Update input value when searchTerm changes externally
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  return (
    <div className="relative">
      <input 
        type="text" 
        placeholder="Search snippets..." 
        value={inputValue}
        onChange={handleInputChange}
        className="w-full py-2 pl-10 pr-4 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
      />
      <div className="absolute left-3 top-2.5 text-slate-400">
        <Search className="h-5 w-5" />
      </div>
    </div>
  );
}
