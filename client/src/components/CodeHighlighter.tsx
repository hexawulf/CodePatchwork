import { Highlight, themes } from "prism-react-renderer";

interface CodeHighlighterProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

export default function CodeHighlighter({ code, language, showLineNumbers = false }: CodeHighlighterProps) {
  // Normalize the language input to match what prism-react-renderer expects
  const getNormalizedLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'python': 'python',
      'py': 'python',
      'java': 'java',
      'csharp': 'csharp',
      'cs': 'csharp',
      'go': 'go',
      'rust': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'c': 'c',
      'cpp': 'cpp',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'markdown': 'markdown',
      'md': 'markdown',
      'bash': 'bash',
      'shell': 'bash',
      'sh': 'bash',
      'sql': 'sql',
    };
    
    return languageMap[lang.toLowerCase()] || 'javascript';
  };
  
  const normalizedLanguage = getNormalizedLanguage(language);
  
  return (
    <Highlight
      theme={themes.nightOwl}
      code={code}
      language={normalizedLanguage}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{ ...style, margin: 0, padding: '1rem', overflow: 'auto' }} className={className}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {showLineNumbers && <span className="opacity-50 mr-4 inline-block w-5 text-right select-none">{i + 1}</span>}
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}