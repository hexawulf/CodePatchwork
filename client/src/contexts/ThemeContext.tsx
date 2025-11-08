import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for system preference or saved preference
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      return savedTheme || (prefersDark ? "dark" : "light");
    }
    
    return "light";
  });

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      console.log(`[ThemeContext] Toggling theme from ${prevTheme} to ${newTheme}`);
      return newTheme;
    });
  };

  // Apply theme to document and save to localStorage
  useEffect(() => {
    console.log(`[ThemeContext] Applying theme: ${theme}`);
    console.log(`[ThemeContext] Before - document classes: ${document.documentElement.className}`);
    
    // Remove both classes first
    document.documentElement.classList.remove("light", "dark");
    // Add the current theme class
    document.documentElement.classList.add(theme);
    // Save to localStorage
    localStorage.setItem("theme", theme);
    
    console.log(`[ThemeContext] After - document classes: ${document.documentElement.className}`);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    toggleTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}
