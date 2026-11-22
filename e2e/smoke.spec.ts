import { expect, test } from "@playwright/test";

test.describe("CodePatchwork 2.0 E2E smoke", () => {
  test("health, public API, and meta endpoints respond cleanly", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.status()).toBe(200);
    const healthBody = await health.json();
    expect(healthBody.status).toBe("healthy");
    expect(healthBody.database).toBe("connected");

    const pub = await request.get("/api/public/snippets");
    expect(pub.status()).toBe(200);
    const snippets = await pub.json();
    expect(Array.isArray(snippets)).toBe(true);
    expect(snippets.length).toBeGreaterThan(0);

    const meta = await request.get("/api/meta");
    expect(meta.status()).toBe(200);
    const metaBody = await meta.json();
    expect(metaBody.counts.public).toBeGreaterThan(0);

    // Protected route must still fail closed with 401
    const unauth = await request.get("/api/snippets");
    expect(unauth.status()).toBe(401);
  });

  test("library loads, filters, opens Snippet Drawer, Command Palette, Theme toggle, and About modal", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("response", (res) => {
      if (res.status() >= 500) {
        serverErrors.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Snippet cards render
    const firstArticle = page.getByRole("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 10000 });

    // Search box accepts input without error
    const searchInput = page.getByRole("textbox").first();
    await searchInput.fill("python");
    await expect(searchInput).toHaveValue("python");
    await searchInput.fill("");

    // Open Snippet Inspector Drawer
    await firstArticle.getByRole("button", { name: "Inspect snippet" }).click();
    await expect(page.getByRole("button", { name: /copy/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /markdown/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /download/i })).toBeVisible();
    await page.keyboard.press("Escape");

    // Open Command Palette via Ctrl+K
    await page.keyboard.press("Control+k");
    const paletteInput = page.getByPlaceholder(/jump to snippet/i);
    await expect(paletteInput).toBeVisible();
    await paletteInput.press("Escape");
    await expect(paletteInput).toBeHidden();

    // Toggle theme dark <-> light
    const beforeDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    await page.getByRole("button", { name: "Toggle theme" }).click();
    const afterDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(afterDark).not.toBe(beforeDark);

    // Open About modal and verify fleetwide Developer attribution
    await page.getByRole("button", { name: "About CodePatchwork" }).click();
    await expect(page.getByText("Erling Wulf Weinreich (0xWulf)")).toBeVisible();
    await expect(page.locator('a[href="mailto:dev@0xwulf.dev"]')).toBeVisible();
    await page.keyboard.press("Escape");

    expect(pageErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  });

  test("shared snippet page injects OG meta and serves plain-text raw endpoint", async ({
    request,
    page,
  }) => {
    const pub = await request.get("/api/public/snippets");
    const snippets = (await pub.json()) as Array<{ shareId?: string | null; title: string; code: string }>;
    const shared = snippets.find((s) => Boolean(s.shareId));
    test.skip(!shared, "No public snippet with a shareId found");

    const shareId = shared!.shareId!;
    const raw = await request.get(`/api/shared/${shareId}/raw`);
    expect(raw.status()).toBe(200);
    expect(raw.headers()["content-type"]).toContain("text/plain");
    expect(await raw.text()).toBe(shared!.code);

    const htmlRes = await request.get(`/shared/${shareId}`);
    expect(htmlRes.status()).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain('property="og:title"');
    expect(html).toContain(shared!.title.slice(0, 20));

    await page.goto(`/shared/${shareId}`, { waitUntil: "networkidle" });
    await expect(page.getByText(shared!.title).first()).toBeVisible();
  });

  test("mobile viewport (390px) renders without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
