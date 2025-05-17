import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  code?: string;
  language?: string;
  showLineNumbers?: boolean;
}

// List of supported languages in prism-react-renderer
const supportedLanguages = [
  "markup", "html", "xml", "svg", "mathml", "ssml", "atom", "rss",
  "css", "clike", "javascript", "js", "jsx", "typescript", "ts", "tsx",
  "bash", "c", "cpp", "csharp", "diff", "git", "go", "graphql", "json",
  "markdown", "md", "python", "py", "sql", "yaml", "yml"
];

export default function CodeBlock({ code = "", language = "text", showLineNumbers = false }: CodeBlockProps) {
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
  
  try {
    return (
      <Highlight 
        theme={themes.nightOwl}
        code={safeCode} 
        language={normalizedLanguage}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre style={{ ...style, margin: 0, padding: '1rem', textAlign: 'left', overflow: 'auto' }} className={className}>
            {tokens.map((line, i) => (
              <div key={i} style={getLineProps({ line, key: i }).style} className={getLineProps({ line, key: i }).className}>
                {showLineNumbers && <span className="opacity-50 mr-4 inline-block w-8 text-right">{i + 1}</span>}
                {line.map((token, key) => (
                  <span key={key} style={getTokenProps({ token, key }).style} className={getTokenProps({ token, key }).className}>
                    {token.content}
                  </span>
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
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