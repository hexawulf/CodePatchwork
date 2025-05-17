import { createContext, useContext, useState, ReactNode } from "react";
import { CodeTheme } from "../components/CodeBlock";

interface CodeThemeContextType {
  codeTheme: CodeTheme;
  setCodeTheme: (theme: CodeTheme) => void;
}

const CodeThemeContext = createContext<CodeThemeContextType | undefined>(undefined);

export function CodeThemeProvider({ children }: { children: ReactNode }) {
  const [codeTheme, setCodeTheme] = useState<CodeTheme>("nightOwl");
  
  return (
    <CodeThemeContext.Provider value={{ codeTheme, setCodeTheme }}>
      {children}
    </CodeThemeContext.Provider>
  );
}

export function useCodeTheme() {
  const context = useContext(CodeThemeContext);
  if (context === undefined) {
    throw new Error("useCodeTheme must be used within a CodeThemeProvider");
  }
  return context;
}