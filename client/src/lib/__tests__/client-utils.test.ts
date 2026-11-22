import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({
  auth: { currentUser: null },
  googleProvider: {},
}));

import { buildQueryUrl } from "../queryClient";
import { formatSnippetMarkdown, getSnippetFilename, sortSnippets } from "../snippets";
import { getLanguageColor, getLanguageExtension } from "../constants";
import { cn, stringToColor } from "../utils";
import { DEFAULT_PREFERENCES, parseStoredPreferences } from "@/contexts/PreferencesContext";
import type { Snippet } from "@shared/schema";

describe("buildQueryUrl", () => {
  it("preserves single-segment URLs and query strings", () => {
    expect(buildQueryUrl(["/api/snippets"])).toBe("/api/snippets");
    expect(buildQueryUrl(["/api/snippets?tag=go&favorites=true"])).toBe(
      "/api/snippets?tag=go&favorites=true",
    );
  });

  it("joins multi-segment keys into REST paths", () => {
    expect(buildQueryUrl(["/api/collections", 12])).toBe("/api/collections/12");
    expect(buildQueryUrl(["/api/collections", 12, "snippets"])).toBe(
      "/api/collections/12/snippets",
    );
    expect(buildQueryUrl(["/api/collections/", 42, "snippets"])).toBe(
      "/api/collections/42/snippets",
    );
  });

  it("skips null/undefined segments and encodes non-base segments", () => {
    expect(buildQueryUrl(["/api/collections", null, undefined])).toBe("/api/collections");
    expect(buildQueryUrl(["/api/shared", "a/b"])).toBe("/api/shared/a%2Fb");
  });
});

describe("snippet helpers", () => {
  const mk = (id: number, title: string, updatedAt: string, viewCount: number): Snippet => ({
    id,
    title,
    code: "",
    language: "typescript",
    description: null,
    tags: null,
    userId: "u1",
    createdAt: new Date(updatedAt),
    updatedAt: new Date(updatedAt),
    viewCount,
    isFavorite: false,
    shareId: null,
    isPublic: false,
  });

  const sample = [
    mk(1, "Beta", "2026-01-02T00:00:00Z", 5),
    mk(2, "Alpha", "2026-01-03T00:00:00Z", 2),
    mk(3, "Gamma", "2026-01-01T00:00:00Z", 20),
  ];

  it("sorts without mutating the input array", () => {
    const before = sample.map((s) => s.id);
    expect(sortSnippets(sample, "recent").map((s) => s.id)).toEqual([2, 1, 3]);
    expect(sortSnippets(sample, "oldest").map((s) => s.id)).toEqual([3, 1, 2]);
    expect(sortSnippets(sample, "views").map((s) => s.id)).toEqual([3, 1, 2]);
    expect(sortSnippets(sample, "az").map((s) => s.id)).toEqual([2, 1, 3]);
    expect(sortSnippets(sample, "za").map((s) => s.id)).toEqual([3, 1, 2]);
    expect(sample.map((s) => s.id)).toEqual(before);
  });

  it("builds safe download filenames from title and language", () => {
    expect(getSnippetFilename("My React Hook!", "tsx")).toBe("my-react-hook.tsx");
    expect(getSnippetFilename("Prod Container", "docker")).toBe("Dockerfile");
    expect(getSnippetFilename("!!!", "unknown")).toBe("snippet.txt");
  });

  it("formats Markdown fenced code blocks cleanly", () => {
    expect(
      formatSnippetMarkdown({
        title: "Hello",
        description: "Quick demo",
        language: "python",
        code: "print('hi')",
      }),
    ).toBe("### Hello\n\nQuick demo\n\n```python\nprint('hi')\n```");
  });
});

describe("preferences parsing", () => {
  it("falls back safely on null, invalid JSON, or bad enum values", () => {
    expect(parseStoredPreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parseStoredPreferences("{broken")).toEqual(DEFAULT_PREFERENCES);
    expect(
      parseStoredPreferences(JSON.stringify({ codeTheme: "bogus", tabSize: 99, wordWrap: true })),
    ).toEqual({
      ...DEFAULT_PREFERENCES,
      wordWrap: true,
    });
  });

  it("preserves valid stored preferences", () => {
    expect(
      parseStoredPreferences(
        JSON.stringify({
          codeTheme: "dracula",
          editorFont: "JetBrains Mono",
          tabSize: 4,
          showLineNumbers: false,
          wordWrap: true,
          defaultViewMode: "list",
        }),
      ),
    ).toEqual({
      codeTheme: "dracula",
      editorFont: "JetBrains Mono",
      tabSize: 4,
      showLineNumbers: false,
      wordWrap: true,
      defaultViewMode: "list",
    });
  });
});

describe("constants and utils", () => {
  it("resolves language colors and extensions case-insensitively with fallbacks", () => {
    expect(getLanguageColor("TypeScript")).toBe("#3178C6");
    expect(getLanguageColor("python")).toBe("#3572A5");
    expect(getLanguageColor("unknown-lang")).toBe("#64748b");
    expect(getLanguageColor(undefined)).toBe("#64748b");
    expect(getLanguageExtension("bash")).toBe("sh");
    expect(getLanguageExtension("unknown")).toBe("txt");
  });

  it("produces deterministic 6-digit hex colors from strings", () => {
    const c1 = stringToColor("react");
    const c2 = stringToColor("react");
    expect(c1).toBe(c2);
    expect(c1).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("merges conflicting tailwind classes cleanly", () => {
    expect(cn("p-2 text-sm", "p-4")).toBe("text-sm p-4");
  });
});
