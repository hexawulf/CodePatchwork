import { Link, useLocation } from "wouter";
import {
  Code2,
  Star,
  Globe,
  FolderOpen,
  Settings,
  Sun,
  Moon,
  Upload,
  Info,
  X,
  Command,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { LibraryMeta } from "@shared/schema";
import { cn } from "@/lib/utils";
import { getLanguageColor } from "@/lib/constants";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { useTheme } from "@/contexts/ThemeContext";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const {
    selectedLanguages,
    toggleLanguage,
    selectedTags,
    toggleTag,
    favoritesOnly,
    setFavoritesOnly,
    visibility,
    setVisibility,
    clearFilters,
    setImportExportOpen,
    setAboutOpen,
    setCommandOpen,
  } = useSnippetContext();

  const { data: meta } = useQuery<LibraryMeta>({
    queryKey: ["/api/meta"],
  });

  const goToLibrary = () => {
    if (location !== "/") navigate("/");
    onClose?.();
  };

  const selectAll = () => {
    clearFilters();
    goToLibrary();
  };

  const selectFavorites = () => {
    setVisibility("all");
    setFavoritesOnly(true);
    goToLibrary();
  };

  const selectPublic = () => {
    setFavoritesOnly(false);
    setVisibility("public");
    goToLibrary();
  };

  const isLibrary = location === "/";
  const isAllActive = isLibrary && !favoritesOnly && visibility === "all";
  const isFavActive = isLibrary && favoritesOnly;
  const isPubActive = isLibrary && visibility === "public" && !favoritesOnly;

  const navBtn = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <aside className={cn("flex flex-col bg-card", className)}>
      {/* Brand header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <button
          type="button"
          onClick={selectAll}
          className="flex items-center gap-2.5 text-left"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
            CP
          </span>
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            CodePatchwork
          </span>
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main Nav + Facets */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        <div className="space-y-0.5">
          <button type="button" onClick={selectAll} className={navBtn(isAllActive)}>
            <span className="flex items-center gap-2.5">
              <Code2 className="h-4 w-4" />
              All Snippets
            </span>
            {meta && (
              <span className="text-xs opacity-70">{meta.counts.total}</span>
            )}
          </button>

          <button type="button" onClick={selectFavorites} className={navBtn(isFavActive)}>
            <span className="flex items-center gap-2.5">
              <Star className="h-4 w-4" />
              Favorites
            </span>
            {meta && (
              <span className="text-xs opacity-70">{meta.counts.favorites}</span>
            )}
          </button>

          <button type="button" onClick={selectPublic} className={navBtn(isPubActive)}>
            <span className="flex items-center gap-2.5">
              <Globe className="h-4 w-4" />
              Public
            </span>
            {meta && (
              <span className="text-xs opacity-70">{meta.counts.public}</span>
            )}
          </button>

          <Link href="/collections" onClick={onClose}>
            <div className={navBtn(location.startsWith("/collections"))}>
              <span className="flex items-center gap-2.5">
                <FolderOpen className="h-4 w-4" />
                Collections
              </span>
              {meta && (
                <span className="text-xs opacity-70">{meta.counts.collections}</span>
              )}
            </div>
          </Link>
        </div>

        {/* Languages with counts */}
        {meta && meta.languages.length > 0 && (
          <div>
            <div className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Languages
            </div>
            <ul className="space-y-0.5">
              {meta.languages.slice(0, 8).map(({ name, count }) => {
                const active = selectedLanguages.includes(name);
                return (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => {
                        toggleLanguage(name);
                        goToLibrary();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: getLanguageColor(name) }}
                        />
                        <span className="truncate">{name}</span>
                      </span>
                      <span className="text-[11px] opacity-65">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Tags with counts */}
        {meta && meta.tags.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between px-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tags
              </span>
              {meta.tags.length > 10 && (
                <Link href="/tags" onClick={onClose}>
                  <span className="text-[11px] text-primary hover:underline cursor-pointer">
                    All ({meta.tags.length})
                  </span>
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 px-2">
              {meta.tags.slice(0, 10).map(({ name, count }) => {
                const active = selectedTags.includes(name);
                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() => {
                      toggleTag(name);
                      goToLibrary();
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    #{name}
                    <span className="opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Utility Footer Rail */}
      <div className="border-t border-border p-2.5 space-y-1">
        <button
          type="button"
          onClick={() => {
            onClose?.();
            setCommandOpen(true);
          }}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Command className="h-3.5 w-3.5" />
            Quick actions
          </span>
          <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose?.();
              setImportExportOpen(true);
            }}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Import / Export JSON"
            aria-label="Import or export snippets"
          >
            <Upload className="h-4 w-4" />
          </button>

          <Link href="/settings" onClick={onClose}>
            <div
              className={cn(
                "rounded-md p-2 transition-colors cursor-pointer",
                location === "/settings"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </div>
          </Link>

          <button
            type="button"
            onClick={() => {
              onClose?.();
              setAboutOpen(true);
            }}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="About CodePatchwork"
            aria-label="About CodePatchwork"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
