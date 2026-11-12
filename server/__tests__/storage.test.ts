import { beforeEach, describe, expect, it, vi } from "vitest";

/** Records what the storage layer hands to drizzle, without a database. */
const calls = vi.hoisted(() => ({ values: [] as any[], set: [] as any[] }));

vi.mock("../db", () => {
  const chain: any = {
    insert: () => chain,
    update: () => chain,
    values: (v: any) => {
      calls.values.push(v);
      return chain;
    },
    set: (v: any) => {
      calls.set.push(v);
      return chain;
    },
    where: () => chain,
    returning: async () => [{ id: 1 }],
  };
  return { db: chain };
});

import { escapeLike, newShareId, storage } from "../storage";

beforeEach(() => {
  calls.values.length = 0;
  calls.set.length = 0;
});

describe("escapeLike", () => {
  it("escapes LIKE wildcards and the escape character", () => {
    expect(escapeLike("100%")).toBe("100\\%");
    expect(escapeLike("a_b")).toBe("a\\_b");
    expect(escapeLike("back\\slash")).toBe("back\\\\slash");
    expect(escapeLike("plain text")).toBe("plain text");
  });
});

describe("newShareId", () => {
  it("returns 12 URL-safe characters and does not repeat", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newShareId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{12}$/);
  });
});

describe("snippet writes keep isPublic (CP-05)", () => {
  const base = { title: "t", code: "c", language: "js" } as any;

  it("createSnippet stores isPublic: true", async () => {
    await storage.createSnippet({ ...base, isPublic: true });
    expect(calls.values[0].isPublic).toBe(true);
  });

  it("createSnippet defaults to private", async () => {
    await storage.createSnippet(base);
    expect(calls.values[0].isPublic).toBe(false);
  });

  it("updateSnippet passes isPublic through and leaves it alone when absent", async () => {
    await storage.updateSnippet(1, { ...base, isPublic: true });
    expect(calls.set[0].isPublic).toBe(true);
    await storage.updateSnippet(1, base);
    expect(calls.set[1].isPublic).toBeUndefined();
  });
});
