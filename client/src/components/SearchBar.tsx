import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useSnippetContext } from "@/contexts/SnippetContext";

export default function SearchBar() {
  const { searchTerm, setSearchTerm } = useSnippetContext();
  const [inputValue, setInputValue] = useState(searchTerm || "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    clearTimer();
    timerRef.current = setTimeout(() => setSearchTerm(value), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimer();
      setSearchTerm(inputValue);
    }
  };

  useEffect(() => {
    setInputValue(searchTerm || "");
  }, [searchTerm]);

  useEffect(() => clearTimer, []);

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
