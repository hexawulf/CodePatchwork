import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import ThemeSelector from "./ThemeSelector";

// Define supported themes
export type CodeTheme = "nightOwl" | "dracula" | "github" | "vsDark" | "vsLight";

interface CodeBlockProps {
  code?: string;
  language?: string;
  showLineNumbers?: boolean;
  initialTheme?: CodeTheme;
  showThemeSelector?: boolean;
}

// List of supported languages in prism-react-renderer
const supportedLanguages = [
  "markup", "html", "xml", "svg", "mathml", "ssml", "atom", "rss",
  "css", "clike", "javascript", "js", "jsx", "typescript", "ts", "tsx",
  "bash", "c", "cpp", "csharp", "diff", "git", "go", "graphql", "json",
  "markdown", "md", "python", "py", "sql", "yaml", "yml"
];

export default function CodeBlock({ 
  code = "", 
  language = "text", 
  showLineNumbers = false,
  initialTheme = "nightOwl",
  showThemeSelector = true
}: CodeBlockProps) {
  const [theme, setTheme] = useState<CodeTheme>(initialTheme);
  
  // Normalize language and ensure it's supported
  let normalizedLanguage = "text";
  
  if (language) {
    const langLower = language.toLowerCase();
    // Check if the language is supported
    if (supportedLanguages.includes(langLower)) {
      normalizedLanguage = langLower;
    }
  }
  
  // If code is undefined or null, provide a fallback
  const safeCode = code || "";
  
  // Get the theme object based on the theme name
  const getThemeObject = (themeName: CodeTheme) => {
    switch (themeName) {
      case "dracula":
        return themes.dracula;
      case "github":
        return themes.github;
      case "vsDark":
        return themes.vsDark;
      case "vsLight":
        return themes.vsLight;
      case "nightOwl":
      default:
        return themes.nightOwl;
    }
  };
  
  try {
    return (
      <div className="relative">
        {showThemeSelector && (
          <div className="absolute top-2 right-2 z-10">
            <ThemeSelector 
              value={theme} 
              onChange={setTheme} 
            />
          </div>
        )}
        <Highlight 
          theme={getThemeObject(theme)}
          code={safeCode} 
          language={normalizedLanguage}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{ ...style, margin: 0, padding: '1rem', textAlign: 'left', overflow: 'auto' }} className={className}>
              {tokens.map((line, i) => (
                <div key={i} className={getLineProps({ line, key: i }).className} style={getLineProps({ line, key: i }).style}>
                  {showLineNumbers && <span className="opacity-50 mr-4 inline-block w-8 text-right">{i + 1}</span>}
                  {line.map((token, key) => (
                    <span key={key} className={getTokenProps({ token, key }).className} style={getTokenProps({ token, key }).style}>
                      {token.content}
                    </span>
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    );
  } catch (error) {
    console.error("Error rendering code block:", error);
    // Fallback to a simple pre/code block if Highlight fails
    return (
      <pre className="bg-slate-800 text-white p-4 rounded overflow-auto">
        <code>{safeCode}</code>
      </pre>
    );
  }
}