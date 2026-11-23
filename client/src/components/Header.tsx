import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { Menu, Plus, Search, Sun, Moon, User, Settings, Upload, Info, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  toggleMobileMenu?: () => void;
  isPublicView?: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export default function Header({
  toggleMobileMenu,
  isPublicView = false,
  searchInputRef,
}: HeaderProps) {
  const { user, isAuthenticated, signIn, signOut } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const {
    searchTerm,
    setSearchTerm,
    openCreateEditor,
    setCommandOpen,
    setImportExportOpen,
    setAboutOpen,
  } = useSnippetContext();
  const [, navigate] = useLocation();

  const [inputValue, setInputValue] = useState(searchTerm);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setInputValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSearchTerm(value), 200);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md">
      {/* Left: Mobile menu + Brand */}
      <div className="flex items-center gap-2 md:hidden">
        {!isPublicView && (
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          CP
        </span>
        <span className="font-semibold tracking-tight text-foreground">CodePatchwork</span>
      </div>

      {/* Center: Single unified search + Command Palette trigger */}
      {!isPublicView ? (
        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (timerRef.current) clearTimeout(timerRef.current);
                setSearchTerm(inputValue);
              }
            }}
            placeholder="Search snippets by title, code, or description..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-20 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {inputValue && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              title="Open Command Palette"
            >
              ⌘K
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-2 font-semibold text-foreground">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            CP
          </span>
          CodePatchwork
        </div>
      )}

      {/* Right: Clean Primary CTA + Account */}
      <div className="flex items-center gap-2">
        {isPublicView && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setAboutOpen(true)}
              aria-label="About CodePatchwork"
            >
              <Info className="h-4 w-4" />
            </Button>
          </>
        )}

        {isAuthenticated && !isPublicView && (
          <Button size="sm" onClick={openCreateEditor} className="h-9 gap-1.5 font-medium">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Snippet</span>
          </Button>
        )}

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0" aria-label="Account menu">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                    {user?.email ? user.email[0].toUpperCase() : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName || "Account"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportExportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import / Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAboutOpen(true)}>
                <Info className="mr-2 h-4 w-4" />
                About CodePatchwork
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" onClick={signIn} className="h-9 gap-1.5">
            <User className="h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
