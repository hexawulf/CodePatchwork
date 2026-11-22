import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Search,
  Plus,
  FolderOpen,
  Settings,
  Upload,
  Sun,
  Moon,
  Palette,
  Info,
  FileCode2,
} from "lucide-react";
import type { CollectionWithCount, Snippet } from "@shared/schema";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePreferences, type CodeTheme } from "@/contexts/PreferencesContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { getLanguageColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  group: "Actions" | "Snippets" | "Collections" | "Code Themes";
  label: string;
  sublabel?: string;
  colorDot?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

const CODE_THEMES: Array<{ value: CodeTheme; label: string }> = [
  { value: "nightOwl", label: "Night Owl" },
  { value: "dracula", label: "Dracula" },
  { value: "github", label: "GitHub" },
  { value: "vsDark", label: "VS Dark" },
  { value: "vsLight", label: "VS Light" },
];

export default function CommandPalette() {
  const {
    isCommandOpen,
    setCommandOpen,
    openCreateEditor,
    openInspector,
    setImportExportOpen,
    setAboutOpen,
  } = useSnippetContext();
  const { isAuthenticated } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const { updatePrefs } = usePreferences();
  const [, navigate] = useLocation();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: snippets = [] } = useQuery<Snippet[]>({
    queryKey: [isAuthenticated ? "/api/snippets" : "/api/public/snippets"],
    enabled: isCommandOpen,
  });

  const { data: collections = [] } = useQuery<CollectionWithCount[]>({
    queryKey: ["/api/collections"],
    enabled: isCommandOpen && isAuthenticated,
  });

  useEffect(() => {
    if (isCommandOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isCommandOpen]);

  const close = () => setCommandOpen(false);

  const allItems = useMemo<CommandItem[]>(() => {
    const actions: CommandItem[] = [
      ...(isAuthenticated
        ? [
            {
              id: "act-new",
              group: "Actions" as const,
              label: "New Snippet",
              sublabel: "Create a code snippet",
              icon: Plus,
              onSelect: () => {
                close();
                openCreateEditor();
              },
            },
            {
              id: "act-import",
              group: "Actions" as const,
              label: "Import / Export Snippets",
              sublabel: "Upload or download JSON library",
              icon: Upload,
              onSelect: () => {
                close();
                setImportExportOpen(true);
              },
            },
            {
              id: "act-collections",
              group: "Actions" as const,
              label: "Go to Collections",
              icon: FolderOpen,
              onSelect: () => {
                close();
                navigate("/collections");
              },
            },
            {
              id: "act-settings",
              group: "Actions" as const,
              label: "Open Settings",
              icon: Settings,
              onSelect: () => {
                close();
                navigate("/settings");
              },
            },
          ]
        : []),
      {
        id: "act-theme",
        group: "Actions",
        label: theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme",
        icon: theme === "dark" ? Sun : Moon,
        onSelect: () => {
          toggleTheme();
          close();
        },
      },
      {
        id: "act-about",
        group: "Actions",
        label: "About CodePatchwork",
        icon: Info,
        onSelect: () => {
          close();
          setAboutOpen(true);
        },
      },
    ];

    const snippetItems: CommandItem[] = snippets.slice(0, 50).map((s) => ({
      id: `snip-${s.id}`,
      group: "Snippets",
      label: s.title,
      sublabel: [s.language, ...(s.tags ?? []).map((t) => `#${t}`)].filter(Boolean).join(" · "),
      colorDot: getLanguageColor(s.language),
      icon: FileCode2,
      onSelect: () => {
        close();
        openInspector(s);
      },
    }));

    const collectionItems: CommandItem[] = collections.map((c) => ({
      id: `col-${c.id}`,
      group: "Collections",
      label: c.name,
      sublabel: `${c.snippetCount ?? 0} snippets`,
      icon: FolderOpen,
      onSelect: () => {
        close();
        navigate(`/collections/${c.id}`);
      },
    }));

    const themeItems: CommandItem[] = CODE_THEMES.map((t) => ({
      id: `ct-${t.value}`,
      group: "Code Themes",
      label: `Code Theme: ${t.label}`,
      icon: Palette,
      onSelect: () => {
        updatePrefs({ codeTheme: t.value });
        close();
      },
    }));

    return [...actions, ...snippetItems, ...collectionItems, ...themeItems];
  }, [
    isAuthenticated,
    theme,
    snippets,
    collections,
    openCreateEditor,
    openInspector,
    setImportExportOpen,
    setAboutOpen,
    toggleTheme,
    updatePrefs,
    navigate,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 14);
    return allItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.sublabel?.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q),
      )
      .slice(0, 18);
  }, [allItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      filtered[activeIndex].onSelect();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCommandOpen(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isCommandOpen} onOpenChange={setCommandOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          onKeyDown={handleKeyDown}
          className="fixed left-1/2 top-[18%] z-50 w-[94vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        >
          <DialogPrimitive.Title className="sr-only">Command Palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search snippets, collections, and actions
          </DialogPrimitive.Description>

          <div className="flex items-center border-b border-border px-4">
            <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to snippet, collection, or command..."
              className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No matching snippets or commands.
              </div>
            ) : (
              filtered.map((item, idx) => {
                const Icon = item.icon;
                const selected = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={item.onSelect}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "bg-primary/15 text-primary"
                        : "text-foreground hover:bg-muted/70",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {item.colorDot ? (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.colorDot }}
                        />
                      ) : Icon ? (
                        <Icon className="h-4 w-4 shrink-0 opacity-75" />
                      ) : null}
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.label}</div>
                        {item.sublabel && (
                          <div className="truncate text-xs text-muted-foreground">
                            {item.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.group}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
