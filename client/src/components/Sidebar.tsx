import { Link, useLocation } from "wouter";
import { Home, FileText, FolderOpen, Tag, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className, onClose }: SidebarProps) {
  const [location] = useLocation();
  // Temporary local state for filters
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Fetch languages
  const { data: languages = [] } = useQuery<string[]>({
    queryKey: ["/api/languages"],
  });

  // Fetch tags
  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/tags"],
  });

  // Handle language selection
  const handleLanguageClick = (language: string) => {
    setActiveLanguage(activeLanguage === language ? null : language);
    if (onClose) onClose();
  };

  // Handle tag selection
  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
    if (onClose) onClose();
  };

  // Get language color
  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: "#F7DF1E",
      typescript: "#3178C6",
      python: "#3572A5",
      java: "#B07219",
      go: "#00ADD8",
      css: "#563D7C",
      html: "#E34F26",
      jsx: "#61DAFB",
      tsx: "#61DAFB",
      sql: "#e38c00",
      bash: "#4EAA25",
    };
    
    return colors[language.toLowerCase()] || "#718096";
  };

  return (
    <aside className={className}>
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-2 p-1.5 rounded-md bg-primary-500 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">CodeCanvas</h1>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <nav className="px-4 py-2">
        <ul>
          <li className="mb-1">
            <Link href="/">
              <div className={cn(
                "flex items-center px-2 py-2 text-sm rounded-md font-medium cursor-pointer",
                location === "/" 
                  ? "bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300" 
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}>
                <Home className="h-5 w-5 mr-2" />
                Home
              </div>
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/snippets">
              <div className={cn(
                "flex items-center px-2 py-2 text-sm rounded-md font-medium cursor-pointer",
                location === "/snippets" 
                  ? "bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300" 
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}>
                <FileText className="h-5 w-5 mr-2" />
                My Snippets
              </div>
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/collections">
              <div className={cn(
                "flex items-center px-2 py-2 text-sm rounded-md font-medium cursor-pointer",
                location === "/collections" 
                  ? "bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300" 
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}>
                <FolderOpen className="h-5 w-5 mr-2" />
                Collections
              </div>
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/tags">
              <div className={cn(
                "flex items-center px-2 py-2 text-sm rounded-md font-medium cursor-pointer",
                location === "/tags" 
                  ? "bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300" 
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}>
                <Tag className="h-5 w-5 mr-2" />
                Tags
              </div>
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/settings">
              <div className={cn(
                "flex items-center px-2 py-2 text-sm rounded-md font-medium cursor-pointer",
                location === "/settings" 
                  ? "bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300" 
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}>
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </div>
            </Link>
          </li>
        </ul>
        
        <div className="mt-8 border-t dark:border-slate-700 pt-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">Languages</h3>
          <ul>
            {languages.slice(0, 5).map(language => (
              <li className="mb-1" key={language}>
                <button
                  onClick={() => handleLanguageClick(language)}
                  className={cn(
                    "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-md",
                    activeLanguage === language
                      ? "bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <span 
                    className="w-2 h-2 mr-2 rounded-full"
                    style={{ backgroundColor: getLanguageColor(language) }}
                  ></span>
                  {language}
                </button>
              </li>
            ))}
            
            {languages.length > 5 && (
              <li>
                <Link href="/languages">
                  <div className="flex items-center px-2 py-1.5 text-sm rounded-md text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                    Show all ({languages.length})
                  </div>
                </Link>
              </li>
            )}
          </ul>
        </div>
        
        <div className="mt-8 border-t dark:border-slate-700 pt-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">Tags</h3>
          <div className="px-2 flex flex-wrap gap-1">
            {tags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={cn(
                  "text-xs py-1 px-2 rounded-full",
                  activeTag === tag
                    ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                {tag}
              </button>
            ))}
            
            {tags.length > 5 && (
              <Link href="/tags">
                <div className="text-xs py-1 px-2 bg-primary-100 dark:bg-primary-900/50 rounded-full text-primary-700 dark:text-primary-300 cursor-pointer">
                  +{tags.length - 5} more
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
}
