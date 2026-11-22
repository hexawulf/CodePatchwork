import type { Snippet } from "@shared/schema";
import { getLanguageExtension, type SortOrder } from "./constants";

export function sortSnippets(snippets: readonly Snippet[], sortOrder: SortOrder | string): Snippet[] {
  return [...snippets].sort((a, b) => {
    switch (sortOrder) {
      case "recent":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "oldest":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case "views":
        return (b.viewCount || 0) - (a.viewCount || 0);
      case "az":
        return a.title.localeCompare(b.title);
      case "za":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });
}

export function getSnippetFilename(title: string, language?: string | null): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "snippet";
  const ext = getLanguageExtension(language);
  return ext === "Dockerfile" ? "Dockerfile" : `${slug}.${ext}`;
}

export function formatSnippetMarkdown(snippet: Pick<Snippet, "title" | "code" | "language" | "description">): string {
  const lang = snippet.language && snippet.language !== "text" ? snippet.language : "";
  const lines = [`### ${snippet.title}`];
  if (snippet.description?.trim()) {
    lines.push("", snippet.description.trim());
  }
  lines.push("", "```" + lang, snippet.code, "```");
  return lines.join("\n");
}

export function downloadSnippetFile(snippet: Pick<Snippet, "title" | "code" | "language">): void {
  const blob = new Blob([snippet.code || ""], { type: "text/plain;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = getSnippetFilename(snippet.title, snippet.language);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}
