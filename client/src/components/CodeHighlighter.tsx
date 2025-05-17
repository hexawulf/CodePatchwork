import { Highlight, themes } from "prism-react-renderer";

// Define available themes type
export type CodeTheme = 
  | 'nightOwl' 
  | 'dracula' 
  | 'github' 
  | 'vsDark' 
  | 'vsLight' 
  | 'palenight'
  | 'duotoneDark'
  | 'duotoneLight'
  | 'oceanicNext'
  | 'okaidia';

interface CodeHighlighterProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  theme?: CodeTheme;
}

export default function CodeHighlighter({ 
  code, 
  language, 
  showLineNumbers = false,
  theme = 'nightOwl' 
}: CodeHighlighterProps) {
  // Normalize the language input to match what prism-react-renderer expects
  const getNormalizedLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      // JavaScript & TypeScript family
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'node': 'javascript',
      'nodejs': 'javascript',
      
      // Python
      'python': 'python',
      'py': 'python',
      'python3': 'python',
      'ipython': 'python',
      'jupyter': 'python',
      
      // Java & JVM languages
      'java': 'java',
      'kotlin': 'kotlin',
      'groovy': 'groovy',
      'scala': 'scala',
      
      // .NET languages
      'csharp': 'csharp',
      'cs': 'csharp',
      'fsharp': 'fsharp',
      'fs': 'fsharp',
      'vb': 'visual-basic',
      'visualbasic': 'visual-basic',
      
      // Systems programming
      'go': 'go',
      'golang': 'go',
      'rust': 'rust',
      'c': 'c',
      'cpp': 'cpp',
      'c++': 'cpp',
      'objectivec': 'objectivec',
      'objc': 'objectivec',
      
      // Web development
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'scss',
      'less': 'less',
      'php': 'php',
      
      // Ruby
      'ruby': 'ruby',
      'rb': 'ruby',
      'rails': 'ruby',
      
      // Mobile development
      'swift': 'swift',
      'dart': 'dart',
      'flutter': 'dart',
      
      // Data formats
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'xml': 'xml',
      'csv': 'csv',
      
      // Markup & Documentation
      'markdown': 'markdown',
      'md': 'markdown',
      'latex': 'latex',
      'tex': 'latex',
      
      // Shell scripting
      'bash': 'bash',
      'shell': 'bash',
      'sh': 'bash',
      'zsh': 'bash',
      'powershell': 'powershell',
      'ps1': 'powershell',
      'batch': 'batch',
      'bat': 'batch',
      'cmd': 'batch',
      
      // Database
      'sql': 'sql',
      'mysql': 'sql',
      'postgresql': 'sql',
      'postgres': 'sql',
      'plsql': 'sql',
      'mongodb': 'javascript',
      'graphql': 'graphql',
      
      // Config & DevOps
      'dockerfile': 'docker',
      'docker': 'docker',
      'nginx': 'nginx',
      'terraform': 'hcl',
      'tf': 'hcl',
      'hcl': 'hcl',
      
      // Functional programming
      'haskell': 'haskell',
      'hs': 'haskell',
      'elixir': 'elixir',
      'ex': 'elixir',
      'elm': 'elm',
      'clojure': 'clojure',
      'clj': 'clojure',
      
      // Other languages
      'r': 'r',
      'matlab': 'matlab',
      'perl': 'perl',
      'lua': 'lua',
    };
    
    return languageMap[lang.toLowerCase()] || 'javascript';
  };
  
  const normalizedLanguage = getNormalizedLanguage(language);
  
  // Get the appropriate theme from themes object
  const getTheme = (themeName: CodeTheme) => {
    const themeMap: Record<CodeTheme, any> = {
      'nightOwl': themes.nightOwl,
      'dracula': themes.dracula,
      'github': themes.github,
      'vsDark': themes.vsDark,
      'vsLight': themes.vsLight,
      'palenight': themes.palenight,
      'duotoneDark': themes.duotoneDark,
      'duotoneLight': themes.duotoneLight,
      'oceanicNext': themes.oceanicNext,
      'okaidia': themes.okaidia
    };
    
    return themeMap[themeName] || themes.nightOwl;
  };
  
  return (
    <Highlight
      theme={getTheme(theme)}
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