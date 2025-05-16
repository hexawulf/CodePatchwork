import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({ code, language, showLineNumbers = false }: CodeBlockProps) {
  // Normalize language - sometimes we might get variations like 'jsx' vs 'javascript'
  const normalizedLanguage = language.toLowerCase();
  
  return (
    <Highlight 
      theme={themes.nightOwl}
      code={code} 
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
}