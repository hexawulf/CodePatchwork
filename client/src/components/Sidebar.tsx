import { Link, useLocation } from "wouter";
import { Home, FileText, FolderOpen, Tag, Settings, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getLanguageColor } from "@/lib/constants";
import { useSnippetContext } from "@/contexts/SnippetContext";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/snippets", label: "My Snippets", icon: FileText },
  { href: "/collections", label: "Collections", icon: FolderOpen },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function Sidebar({ className, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { activeLanguage, setActiveLanguage, activeTag, setActiveTag } = useSnippetContext();

  const { data: languages = [] } = useQuery<string[]>({
    queryKey: ["/api/languages"],
  });

  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/tags"],
  });

  const handleLanguageClick = (language: string) => {
    const next = activeLanguage === language ? null : language;
    setActiveLanguage(next);
    if (next && location !== "/snippets") {
      navigate("/snippets");
    }
    onClose?.();
  };

  const handleTagClick = (tag: string) => {
    const next = activeTag === tag ? null : tag;
    setActiveTag(next);
    if (next && location !== "/snippets") {
      navigate("/snippets");
    }
    onClose?.();
  };

  return (
    <aside className={className}>
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-2 p-1.5 rounded-md bg-primary-500 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">CodePatchwork</h1>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <nav className="px-4 py-2">
        <ul>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li className="mb-1" key={href}>
              <Link href={href} onClick={onClose}>
                <div
                  className={cn(
                    "flex items-center px-2 py-2 text-sm rounded-md font-medium cursor-pointer",
                    location === href
                      ? "bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  )}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {label}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t dark:border-slate-700 pt-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">
            Languages
          </h3>
          <ul>
            {languages.slice(0, 5).map((language) => (
              <li className="mb-1" key={language}>
                <button
                  type="button"
                  onClick={() => handleLanguageClick(language)}
                  className={cn(
                    "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-md",
                    activeLanguage === language
                      ? "bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  )}
                >
                  <span
                    className="w-2 h-2 mr-2 rounded-full"
                    style={{ backgroundColor: getLanguageColor(language) }}
                  />
                  {language}
                </button>
              </li>
            ))}

            {languages.length > 5 && (
              <li>
                <Link href="/snippets" onClick={onClose}>
                  <div className="flex items-center px-2 py-1.5 text-sm rounded-md text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                    Show all ({languages.length})
                  </div>
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="mt-8 border-t dark:border-slate-700 pt-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">
            Tags
          </h3>
          <div className="px-2 flex flex-wrap gap-1">
            {tags.slice(0, 5).map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={cn(
                  "text-xs py-1 px-2 rounded-full",
                  activeTag === tag
                    ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                )}
              >
                {tag}
              </button>
            ))}

            {tags.length > 5 && (
              <Link href="/tags" onClick={onClose}>
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
