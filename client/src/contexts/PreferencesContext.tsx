import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type CodeTheme = "nightOwl" | "dracula" | "github" | "vsDark" | "vsLight";
export type EditorFont = "Fira Code" | "JetBrains Mono" | "Source Code Pro" | "Inconsolata" | "monospace";
export type TabSize = 2 | 4 | 8;
export type ViewMode = "grid" | "list";

export interface UserPreferences {
  codeTheme: CodeTheme;
  editorFont: EditorFont;
  tabSize: TabSize;
  showLineNumbers: boolean;
  wordWrap: boolean;
  defaultViewMode: ViewMode;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  codeTheme: "nightOwl",
  editorFont: "Fira Code",
  tabSize: 2,
  showLineNumbers: true,
  wordWrap: false,
  defaultViewMode: "grid",
};

const STORAGE_KEY = "codepatchwork:prefs:v2";

const VALID_CODE_THEMES = new Set<CodeTheme>(["nightOwl", "dracula", "github", "vsDark", "vsLight"]);
const VALID_FONTS = new Set<EditorFont>([
  "Fira Code",
  "JetBrains Mono",
  "Source Code Pro",
  "Inconsolata",
  "monospace",
]);
const VALID_TABS = new Set<TabSize>([2, 4, 8]);

export function parseStoredPreferences(raw: string | null): UserPreferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      codeTheme: parsed.codeTheme && VALID_CODE_THEMES.has(parsed.codeTheme)
        ? parsed.codeTheme
        : DEFAULT_PREFERENCES.codeTheme,
      editorFont: parsed.editorFont && VALID_FONTS.has(parsed.editorFont)
        ? parsed.editorFont
        : DEFAULT_PREFERENCES.editorFont,
      tabSize: parsed.tabSize && VALID_TABS.has(parsed.tabSize)
        ? parsed.tabSize
        : DEFAULT_PREFERENCES.tabSize,
      showLineNumbers:
        typeof parsed.showLineNumbers === "boolean"
          ? parsed.showLineNumbers
          : DEFAULT_PREFERENCES.showLineNumbers,
      wordWrap:
        typeof parsed.wordWrap === "boolean"
          ? parsed.wordWrap
          : DEFAULT_PREFERENCES.wordWrap,
      defaultViewMode:
        parsed.defaultViewMode === "grid" || parsed.defaultViewMode === "list"
          ? parsed.defaultViewMode
          : DEFAULT_PREFERENCES.defaultViewMode,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

interface PreferencesContextType {
  prefs: UserPreferences;
  updatePrefs: (patch: Partial<UserPreferences>) => void;
  resetPrefs: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    try {
      return parseStoredPreferences(localStorage.getItem(STORAGE_KEY));
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage access errors
    }
  }, [prefs]);

  const updatePrefs = (patch: Partial<UserPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  };

  const resetPrefs = () => setPrefs(DEFAULT_PREFERENCES);

  return (
    <PreferencesContext.Provider value={{ prefs, updatePrefs, resetPrefs }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
