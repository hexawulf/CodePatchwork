import { Highlight, themes } from "prism-react-renderer";
import { usePreferences, type CodeTheme } from "@/contexts/PreferencesContext";

export type { CodeTheme };

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
  wordWrap?: boolean;
  maxLines?: number;
  compact?: boolean;
}

export default function CodeBlock({
  code = "",
  language = "text",
  showLineNumbers,
  wordWrap,
  maxLines,
  compact = false,
}: CodeBlockProps) {
  const { prefs } = usePreferences();
  const langLower = language?.toLowerCase() ?? "";
  const normalizedLanguage = SUPPORTED_LANGUAGES.has(langLower) ? langLower : "text";
  const safeCode = code || "";
  const allLines = safeCode.split("\n");
  const truncated = maxLines !== undefined && allLines.length > maxLines;
  const displayCode = truncated ? allLines.slice(0, maxLines).join("\n") : safeCode;
  const remainingLines = truncated ? allLines.length - maxLines! : 0;

  const theme = THEME_MAP[prefs.codeTheme] ?? themes.nightOwl;
  const useLineNumbers = showLineNumbers ?? prefs.showLineNumbers;
  const useWordWrap = wordWrap ?? prefs.wordWrap;

  return (
    <div className="relative">
      <Highlight theme={theme} code={displayCode} language={normalizedLanguage}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            style={{
              ...style,
              margin: 0,
              padding: compact ? "0.75rem 0.875rem" : "1rem 1.125rem",
              textAlign: "left",
              overflow: "auto",
              fontFamily: `"${prefs.editorFont}", ui-monospace, SFMono-Regular, Menlo, monospace`,
              fontSize: compact ? "0.78rem" : "0.84rem",
              lineHeight: compact ? "1.45" : "1.55",
              whiteSpace: useWordWrap ? "pre-wrap" : "pre",
              wordBreak: useWordWrap ? "break-word" : "normal",
            }}
            className={`${className} code-scroll`}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} className={lineProps.className} style={lineProps.style}>
                  {useLineNumbers && (
                    <span className="select-none opacity-40 mr-3.5 inline-block w-6 text-right text-[0.72rem]">
                      {i + 1}
                    </span>
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
      {truncated && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-2 pt-8"
          style={{
            background: `linear-gradient(to top, ${theme.plain.backgroundColor || "#011627"} 15%, transparent)`,
          }}
        >
          <span className="rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-medium text-slate-200 backdrop-blur-sm">
            +{remainingLines} more {remainingLines === 1 ? "line" : "lines"}
          </span>
        </div>
      )}
    </div>
  );
}
