import { apiRequest } from "@/lib/queryClient";

/**
 * Download the signed-in user's snippets as a JSON file.
 * The export endpoint needs the bearer token, so a plain link cannot be used.
 */
export async function downloadSnippetsExport(): Promise<number> {
  const snippets = await apiRequest<unknown[]>("GET", "/api/snippets/export");

  const blob = new Blob([JSON.stringify(snippets, null, 2)], {
    type: "application/json",
  });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `codepatchwork-snippets-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

  return Array.isArray(snippets) ? snippets.length : 0;
}
