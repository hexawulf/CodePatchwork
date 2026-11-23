import { afterAll, beforeAll, describe, expect, it } from "vitest";

const HAS_TEST_DB = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!HAS_TEST_DB)("DatabaseStorage (real PostgreSQL integration)", () => {
  let storage: typeof import("../storage").storage;
  let pool: typeof import("../db").pool;
  const uid = `int-user-${Date.now()}`;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const dbMod = await import("../db");
    const storageMod = await import("../storage");
    pool = dbMod.pool;
    storage = storageMod.storage;
  });

  afterAll(async () => {
    if (pool) {
      await pool.query("DELETE FROM comments WHERE userid = $1", [uid]);
      await pool.query(
        'DELETE FROM "collectionItems" WHERE collectionid IN (SELECT id FROM collections WHERE userid = $1)',
        [uid],
      );
      await pool.query("DELETE FROM collections WHERE userid = $1", [uid]);
      await pool.query("DELETE FROM snippets WHERE userid = $1", [uid]);
      await pool.query("DELETE FROM users WHERE id = $1", [uid]);
      await pool.end();
    }
  });

  it("persists users, snippets, multi-tag filters, collectionItems, comments, and cascading deletes", async () => {
    // 1. User upsert
    const user = await storage.upsertUser({
      id: uid,
      email: `${uid}@example.test`,
      displayName: "Integration Tester",
      photoURL: null,
    });
    expect(user.id).toBe(uid);
    expect((await storage.getUser(uid))?.displayName).toBe("Integration Tester");

    // 2. Snippets (public + private)
    const pub = await storage.createSnippet({
      title: "100% Async_Python Snippet",
      description: "Tests ILIKE wildcard escaping and GIN multi-tag lookup",
      code: "async def run():\n    return 42\n",
      language: "python",
      tags: ["python", "async", "integration"],
      userId: uid,
      isPublic: true,
      isFavorite: true,
    });
    const priv = await storage.createSnippet({
      title: "Private Secret Helper",
      description: "Owner only",
      code: "const secret = true;",
      language: "typescript",
      tags: ["ts", "private"],
      userId: uid,
      isPublic: false,
      isFavorite: false,
    });
    expect(pub.id).toBeGreaterThan(0);
    expect(priv.id).toBeGreaterThan(0);

    // 3. Multi-tag filter + wildcard search escaping
    const multiTagged = await storage.getSnippets({
      userId: uid,
      tag: ["python", "async"],
    });
    expect(multiTagged.map((s) => s.id)).toEqual([pub.id]);

    const literalPercent = await storage.getSnippets({
      userId: uid,
      search: "100% Async_Python",
    });
    expect(literalPercent.map((s) => s.id)).toEqual([pub.id]);

    // 4. Share ID generation & lookup
    const shareId = await storage.generateShareId(pub.id);
    expect(shareId.length).toBeGreaterThanOrEqual(8);
    const byShare = await storage.getSnippetByShareId(shareId);
    expect(byShare?.id).toBe(pub.id);

    // 5. Collections + real "collectionItems" (collectionid, snippetid, createdat) mapping
    const col = await storage.createCollection({
      name: "Integration Python Pack",
      description: "Verifies real collectionItems table mapping",
      userId: uid,
    });
    const item1 = await storage.addSnippetToCollection({
      collectionId: col.id,
      snippetId: pub.id,
    });
    // Idempotent duplicate add must return the existing row without throwing
    const itemDup = await storage.addSnippetToCollection({
      collectionId: col.id,
      snippetId: pub.id,
    });
    expect(itemDup.id).toBe(item1.id);

    const colSnippets = await storage.getCollectionSnippets(col.id);
    expect(colSnippets.map((s) => s.id)).toEqual([pub.id]);

    const colIds = await storage.getSnippetCollectionIds(pub.id, uid);
    expect(colIds).toEqual([col.id]);

    const colsWithCount = await storage.getCollections(uid);
    const matchedCol = colsWithCount.find((c) => c.id === col.id);
    expect(matchedCol?.snippetCount).toBe(1);

    // 6. getMeta scoped vs public
    const ownerMeta = await storage.getMeta(uid);
    expect(ownerMeta.counts.total).toBe(2);
    expect(ownerMeta.counts.public).toBe(1);
    expect(ownerMeta.counts.favorites).toBe(1);
    expect(ownerMeta.counts.collections).toBe(1);

    // 7. Comments + transactional cascading deleteSnippet
    const comment = await storage.createComment({
      snippetId: pub.id,
      content: "Integration check comment",
      userId: uid,
    });
    const views = await storage.getCommentsBySnippetId(pub.id);
    expect(views.map((c) => c.id)).toEqual([comment.id]);
    expect(views[0]).not.toHaveProperty("userId");
    expect(typeof views[0].authorName).toBe("string");

    await storage.deleteSnippet(pub.id);
    expect(await storage.getSnippet(pub.id)).toBeUndefined();
    expect(await storage.getCommentsBySnippetId(pub.id)).toEqual([]);
    expect(await storage.getCollectionSnippets(col.id)).toEqual([]);

    // 8. Transactional deleteCollection
    await storage.addSnippetToCollection({ collectionId: col.id, snippetId: priv.id });
    await storage.deleteCollection(col.id);
    expect(await storage.getCollection(col.id)).toBeUndefined();
    expect(await storage.getSnippetCollectionIds(priv.id, uid)).toEqual([]);
  });
});
