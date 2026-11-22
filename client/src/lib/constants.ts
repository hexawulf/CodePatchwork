export const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "React JSX" },
  { value: "tsx", label: "React TSX" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "go", label: "Go" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "sql", label: "SQL" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash/Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "docker", label: "Dockerfile" },
  { value: "graphql", label: "GraphQL" },
] as const;

export const LANGUAGE_COLORS: Record<string, string> = {
  javascript: "#F7DF1E",
  typescript: "#3178C6",
  python: "#3572A5",
  java: "#B07219",
  go: "#00ADD8",
  css: "#563D7C",
  html: "#E34F26",
  jsx: "#61DAFB",
  tsx: "#61DAFB",
  sql: "#e38c00",
  bash: "#4EAA25",
};

export function getLanguageColor(language?: string | null): string {
  if (!language) return "#718096";
  return LANGUAGE_COLORS[language.toLowerCase()] || "#718096";
}

export const SORT_OPTIONS = [
  { value: "recent", label: "Recently Added" },
  { value: "oldest", label: "Oldest First" },
  { value: "views", label: "Most Used" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
] as const;

export type SortOrder = (typeof SORT_OPTIONS)[number]["value"];
