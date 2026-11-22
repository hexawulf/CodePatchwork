export const LANGUAGES = [
  { value: "javascript", label: "JavaScript", ext: "js" },
  { value: "typescript", label: "TypeScript", ext: "ts" },
  { value: "jsx", label: "React JSX", ext: "jsx" },
  { value: "tsx", label: "React TSX", ext: "tsx" },
  { value: "python", label: "Python", ext: "py" },
  { value: "java", label: "Java", ext: "java" },
  { value: "csharp", label: "C#", ext: "cs" },
  { value: "cpp", label: "C++", ext: "cpp" },
  { value: "php", label: "PHP", ext: "php" },
  { value: "go", label: "Go", ext: "go" },
  { value: "ruby", label: "Ruby", ext: "rb" },
  { value: "swift", label: "Swift", ext: "swift" },
  { value: "kotlin", label: "Kotlin", ext: "kt" },
  { value: "rust", label: "Rust", ext: "rs" },
  { value: "html", label: "HTML", ext: "html" },
  { value: "css", label: "CSS", ext: "css" },
  { value: "scss", label: "SCSS", ext: "scss" },
  { value: "sql", label: "SQL", ext: "sql" },
  { value: "json", label: "JSON", ext: "json" },
  { value: "yaml", label: "YAML", ext: "yml" },
  { value: "markdown", label: "Markdown", ext: "md" },
  { value: "bash", label: "Bash/Shell", ext: "sh" },
  { value: "powershell", label: "PowerShell", ext: "ps1" },
  { value: "docker", label: "Dockerfile", ext: "Dockerfile" },
  { value: "graphql", label: "GraphQL", ext: "graphql" },
] as const;

export const LANGUAGE_COLORS: Record<string, string> = {
  javascript: "#F7DF1E",
  typescript: "#3178C6",
  python: "#3572A5",
  java: "#B07219",
  csharp: "#178600",
  cpp: "#F34B7D",
  php: "#4F5D95",
  go: "#00ADD8",
  ruby: "#701516",
  swift: "#F05138",
  kotlin: "#A97BFF",
  rust: "#DEA584",
  css: "#563D7C",
  scss: "#C6538C",
  html: "#E34F26",
  jsx: "#61DAFB",
  tsx: "#61DAFB",
  sql: "#E38C00",
  json: "#292929",
  yaml: "#CB171E",
  markdown: "#083FA1",
  bash: "#4EAA25",
  powershell: "#012456",
  docker: "#384D54",
  graphql: "#E10098",
};

export function getLanguageColor(language?: string | null): string {
  if (!language) return "#64748b";
  return LANGUAGE_COLORS[language.toLowerCase()] || "#64748b";
}

export function getLanguageExtension(language?: string | null): string {
  if (!language) return "txt";
  const match = LANGUAGES.find((l) => l.value === language.toLowerCase());
  return match ? match.ext : "txt";
}

export const SORT_OPTIONS = [
  { value: "recent", label: "Recently Updated" },
  { value: "oldest", label: "Oldest First" },
  { value: "views", label: "Most Used" },
  { value: "az", label: "Title A–Z" },
  { value: "za", label: "Title Z–A" },
] as const;

export type SortOrder = (typeof SORT_OPTIONS)[number]["value"];
