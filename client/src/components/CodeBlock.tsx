import { Highlight, themes } from "prism-react-renderer";
import { useCodeTheme } from "@/contexts/CodeThemeContext";

export type CodeTheme = "nightOwl" | "dracula" | "github" | "vsDark" | "vsLight";

const THEME_MAP = {
  nightOwl: themes.nightOwl,
  dracula: themes.dracula,
  github: themes.github,
  vsDark: themes.vsDark,
  vsLight: themes.vsLight,
} as const;

const SUPPORTED_LANGUAGES = new Set([
  "markup", "html", "xml", "svg", "mathml", "ssml", "atom", "rss",
  "css", "clike", "javascript", "js", "jsx", "typescript", "ts", "tsx",
  "bash", "c", "cpp", "csharp", "diff", "git", "go", "graphql", "json",
  "markdown", "md", "python", "py", "sql", "yaml", "yml",
]);

interface CodeBlockProps {
  code?: string;
  language?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({
  code = "",
  language = "text",
  showLineNumbers = false,
}: CodeBlockProps) {
  const { codeTheme } = useCodeTheme();
  const langLower = language?.toLowerCase() ?? "";
  const normalizedLanguage = SUPPORTED_LANGUAGES.has(langLower) ? langLower : "text";
  const safeCode = code || "";
  const theme = THEME_MAP[codeTheme] ?? themes.nightOwl;

  return (
    <div className="relative">
      <Highlight theme={theme} code={safeCode} language={normalizedLanguage}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            style={{ ...style, margin: 0, padding: "1rem", textAlign: "left", overflow: "auto" }}
            className={className}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} className={lineProps.className} style={lineProps.style}>
                  {showLineNumbers && (
                    <span className="opacity-50 mr-4 inline-block w-8 text-right">{i + 1}</span>
                  )}
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token });
                    return (
                      <span key={key} className={tokenProps.className} style={tokenProps.style}>
                        {token.content}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
