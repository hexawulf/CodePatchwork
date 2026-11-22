import { beforeEach, describe, expect, it, vi } from "vitest";

/** Records what the storage layer hands to drizzle, without a database. */
const calls = vi.hoisted(() => ({
  values: [] as any[],
  set: [] as any[],
  deleted: 0,
  transactions: 0,
  whereCount: 0,
}));

vi.mock("../db", () => {
  const chain: any = {
    select: () => chain,
    from: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => {
      calls.deleted++;
      return chain;
    },
    values: (v: any) => {
      calls.values.push(v);
      return chain;
    },
    set: (v: any) => {
      calls.set.push(v);
      return chain;
    },
    where: () => {
      calls.whereCount++;
      return chain;
    },
    orderBy: async () => [],
    returning: async () => [{ id: 1 }],
    transaction: async (fn: (tx: any) => Promise<void>) => {
      calls.transactions++;
      await fn(chain);
    },
  };
  return { db: chain };
});

import { escapeLike, newShareId, storage } from "../storage";

beforeEach(() => {
  calls.values.length = 0;
  calls.set.length = 0;
  calls.deleted = 0;
  calls.transactions = 0;
  calls.whereCount = 0;
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

describe("storage hardening", () => {
  it("updateCollection never forwards userId", async () => {
    await storage.updateCollection(10, {
      name: "renamed",
      description: "updated",
      userId: "attacker",
    } as any);
    expect(calls.set[0]).toMatchObject({ name: "renamed", description: "updated" });
    expect(calls.set[0]).not.toHaveProperty("userId");
  });

  it("deleteSnippet and deleteCollection run inside a transaction", async () => {
    await storage.deleteSnippet(1);
    expect(calls.transactions).toBe(1);
    expect(calls.deleted).toBe(3);

    await storage.deleteCollection(10);
    expect(calls.transactions).toBe(2);
    expect(calls.deleted).toBe(5);
  });

  it("toggleSnippetFavorite executes a single atomic update", async () => {
    await storage.toggleSnippetFavorite(1);
    expect(calls.set).toHaveLength(1);
    expect(calls.set[0]).toHaveProperty("isFavorite");
  });

  it("getSnippets builds filters cleanly for multi-language and multi-tag arrays", async () => {
    await storage.getSnippets({
      userId: "alice",
      language: ["typescript", "go"],
      tag: ["react", "hooks"],
      search: "100%_test",
      favorites: true,
      isPublic: false,
    });
    expect(calls.whereCount).toBe(1);
  });
});
