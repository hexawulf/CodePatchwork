import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

/**
 * Route tests against an in-memory storage fake. Firebase token verification
 * is replaced by: "token-<uid>" is a valid token for <uid>, anything else is
 * rejected.
 */
const state = vi.hoisted(() => ({
  users: new Map<string, any>(),
  snippets: new Map<number, any>(),
  collections: new Map<number, any>(),
  items: [] as { collectionId: number; snippetId: number }[],
  comments: new Map<number, any>(),
  nextId: 100,
}));

vi.mock("firebase-admin", () => ({
  default: {
    auth: () => ({
      verifyIdToken: async (token: string) => {
        if (typeof token !== "string" || !token.startsWith("token-")) {
          throw new Error("bad token");
        }
        const uid = token.slice("token-".length);
        return { uid, email: `${uid}@example.test`, name: uid, picture: null };
      },
    }),
  },
}));

vi.mock("../logger", () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../storage", () => {
  const visible = (s: any, userId?: string) =>
    s.isPublic === true || (!!userId && s.userId === userId);
  const storage = {
    getUser: async (id: string) => state.users.get(id),
    upsertUser: async (u: any) => {
      const row = { ...state.users.get(u.id), ...u };
      state.users.set(u.id, row);
      return row;
    },
    getSnippets: async (f: any = {}) =>
      [...state.snippets.values()].filter(
        (s) =>
          (f.userId === undefined || s.userId === f.userId) &&
          (f.isPublic === undefined || s.isPublic === f.isPublic)
      ),
    getSnippet: async (id: number) => state.snippets.get(id),
    createSnippet: async (s: any) => {
      const row = { id: state.nextId++, isPublic: false, isFavorite: false, ...s };
      state.snippets.set(row.id, row);
      return row;
    },
    updateSnippet: async (id: number, s: any) => {
      const row = { ...state.snippets.get(id), ...s };
      state.snippets.set(id, row);
      return row;
    },
    deleteSnippet: async (id: number) => void state.snippets.delete(id),
    incrementSnippetViewCount: async () => undefined,
    getLanguages: async (userId?: string) =>
      [...new Set([...state.snippets.values()].filter((s) => visible(s, userId)).map((s) => s.language))].sort(),
    getTags: async (userId?: string) =>
      [...new Set([...state.snippets.values()].filter((s) => visible(s, userId)).flatMap((s) => s.tags ?? []))].sort(),
    getCollections: async (userId: string) =>
      [...state.collections.values()].filter((c) => c.userId === userId),
    getCollection: async (id: number) => state.collections.get(id),
    getCollectionSnippets: async (collectionId: number) =>
      state.items
        .filter((i) => i.collectionId === collectionId)
        .map((i) => state.snippets.get(i.snippetId))
        .filter(Boolean),
    addSnippetToCollection: async (item: any) => {
      state.items.push(item);
      return { id: state.nextId++, ...item };
    },
    removeSnippetFromCollection: async () => undefined,
    getComment: async (id: number) => state.comments.get(id),
    getCommentsBySnippetId: async (snippetId: number) =>
      [...state.comments.values()].filter((c) => c.snippetId === snippetId),
    createComment: async (c: any) => {
      const row = { id: state.nextId++, ...c };
      state.comments.set(row.id, row);
      return row;
    },
    updateComment: async (id: number, patch: any) => {
      const row = { ...state.comments.get(id), ...patch };
      state.comments.set(id, row);
      return row;
    },
    deleteComment: async (id: number) => void state.comments.delete(id),
  };
  return { storage };
});

import { registerRoutes } from "../routes";

const ALICE = { Authorization: "Bearer token-alice" };
const BOB = { Authorization: "Bearer token-bob" };

async function makeApp() {
  const app = express();
  app.use(express.json());
  await registerRoutes(app);
  return app;
}

beforeEach(() => {
  state.users.clear();
  state.snippets.clear();
  state.collections.clear();
  state.comments.clear();
  state.items.length = 0;
  state.nextId = 100;

  state.users.set("alice", { id: "alice", email: "alice@example.test", displayName: "Alice" });
  state.users.set("bob", { id: "bob", email: "bob@example.test", displayName: "Bob" });

  // 1: alice private, 2: alice public, 3: bob private
  state.snippets.set(1, { id: 1, title: "a-private", code: "secret()", language: "python", tags: ["alice-secret-tag"], userId: "alice", isPublic: false });
  state.snippets.set(2, { id: 2, title: "a-public", code: "hello()", language: "go", tags: ["shared-tag"], userId: "alice", isPublic: true });
  state.snippets.set(3, { id: 3, title: "b-private", code: "bob()", language: "rust", tags: ["bob-tag"], userId: "bob", isPublic: false });

  state.collections.set(10, { id: 10, name: "alice-col", userId: "alice" });
  state.collections.set(11, { id: 11, name: "bob-col", userId: "bob" });

  state.comments.set(50, { id: 50, snippetId: 1, userId: "alice", content: "note on private" });
  state.comments.set(51, { id: 51, snippetId: 2, userId: "bob", content: "nice" });
});

describe("POST /api/auth/user (CP-01)", () => {
  it("rejects a body with uid but no idToken and writes nothing", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/api/auth/user")
      .send({ uid: "alice", email: "attacker@evil.test", displayName: "Mallory" });
    expect(res.status).toBe(400);
    expect(state.users.get("alice").email).toBe("alice@example.test");
  });

  it("rejects an invalid token with 401", async () => {
    const app = await makeApp();
    const res = await request(app).post("/api/auth/user").send({ idToken: "garbage" });
    expect(res.status).toBe(401);
  });

  it("builds the user from the verified token and ignores extra fields", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/api/auth/user")
      .send({ idToken: "token-carol", uid: "alice", email: "attacker@evil.test" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("carol");
    expect(res.body.email).toBe("carol@example.test");
    expect(state.users.get("alice").email).toBe("alice@example.test");
  });

  it("rejects a non-string idToken", async () => {
    const app = await makeApp();
    const res = await request(app).post("/api/auth/user").send({ idToken: { a: 1 } });
    expect(res.status).toBe(400);
  });
});

describe("collections and private snippets (CP-02)", () => {
  it("refuses to add another user's private snippet to my collection", async () => {
    const app = await makeApp();
    const res = await request(app).post("/api/collections/11/snippets/1").set(BOB);
    expect(res.status).toBe(404);
    expect(state.items).toHaveLength(0);
  });

  it("allows adding my own private snippet and someone's public snippet", async () => {
    const app = await makeApp();
    expect((await request(app).post("/api/collections/11/snippets/3").set(BOB)).status).toBe(201);
    expect((await request(app).post("/api/collections/11/snippets/2").set(BOB)).status).toBe(201);
  });

  it("never lists a private snippet of another user, even if an item row exists", async () => {
    state.items.push({ collectionId: 11, snippetId: 1 }, { collectionId: 11, snippetId: 2 }, { collectionId: 11, snippetId: 3 });
    const app = await makeApp();
    const res = await request(app).get("/api/collections/11/snippets").set(BOB);
    expect(res.status).toBe(200);
    expect(res.body.map((s: any) => s.id).sort()).toEqual([2, 3]);
  });

  it("refuses access to someone else's collection", async () => {
    const app = await makeApp();
    expect((await request(app).get("/api/collections/10/snippets").set(BOB)).status).toBe(403);
    expect((await request(app).post("/api/collections/10/snippets/3").set(BOB)).status).toBe(403);
  });
});

describe("comments (CP-03)", () => {
  it("hides comments on a private snippet from anonymous callers and other users", async () => {
    const app = await makeApp();
    expect((await request(app).get("/api/snippets/1/comments")).status).toBe(404);
    expect((await request(app).get("/api/snippets/1/comments").set(BOB)).status).toBe(404);
  });

  it("shows them to the owner, and public snippets' comments to anyone", async () => {
    const app = await makeApp();
    const own = await request(app).get("/api/snippets/1/comments").set(ALICE);
    expect(own.status).toBe(200);
    expect(own.body).toHaveLength(1);
    const pub = await request(app).get("/api/snippets/2/comments");
    expect(pub.status).toBe(200);
    expect(pub.body).toHaveLength(1);
  });

  it("refuses a comment on another user's private snippet", async () => {
    const app = await makeApp();
    const res = await request(app).post("/api/snippets/1/comments").set(BOB).send({ content: "hi" });
    expect(res.status).toBe(404);
    expect(state.comments.size).toBe(2);
  });

  it("creates a comment on a public snippet as the caller, ignoring a spoofed userId", async () => {
    const app = await makeApp();
    const res = await request(app)
      .post("/api/snippets/2/comments")
      .set(BOB)
      .send({ content: "hello", userId: "alice", snippetId: 1 });
    expect(res.status).toBe(201);
    expect(res.body.userId).toBe("bob");
    expect(res.body.snippetId).toBe(2);
  });

  it("update changes only the content", async () => {
    const app = await makeApp();
    const res = await request(app)
      .put("/api/comments/51")
      .set(BOB)
      .send({ content: "edited", snippetId: 1, userId: "alice" });
    expect(res.status).toBe(200);
    expect(state.comments.get(51)).toMatchObject({ content: "edited", snippetId: 2, userId: "bob" });
  });

  it("update rejects an empty body and other users", async () => {
    const app = await makeApp();
    expect((await request(app).put("/api/comments/51").set(BOB).send({ snippetId: 1 })).status).toBe(400);
    expect((await request(app).put("/api/comments/51").set(ALICE).send({ content: "x" })).status).toBe(403);
  });
});

describe("GET /api/snippets/export (CP-04)", () => {
  it("returns only the caller's snippets, without ids or owner", async () => {
    const app = await makeApp();
    const res = await request(app).get("/api/snippets/export").set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.map((s: any) => s.title).sort()).toEqual(["a-private", "a-public"]);
    expect(res.body[0]).not.toHaveProperty("id");
    expect(res.body[0]).not.toHaveProperty("userId");
  });

  it("needs authentication", async () => {
    const app = await makeApp();
    expect((await request(app).get("/api/snippets/export")).status).toBe(401);
  });
});

describe("snippet visibility", () => {
  it("create and import keep isPublic (CP-05, route level)", async () => {
    const app = await makeApp();
    const created = await request(app)
      .post("/api/snippets")
      .set(ALICE)
      .send({ title: "t", code: "c", isPublic: true });
    expect(created.status).toBe(201);
    expect(created.body.isPublic).toBe(true);
  });

  it("a private snippet is 404 for others and for anonymous callers", async () => {
    const app = await makeApp();
    expect((await request(app).get("/api/snippets/1")).status).toBe(404);
    expect((await request(app).get("/api/snippets/1").set(BOB)).status).toBe(404);
    expect((await request(app).get("/api/snippets/1").set(ALICE)).status).toBe(200);
    expect((await request(app).get("/api/public/snippets/1")).status).toBe(404);
  });

  it("other users cannot edit or delete my snippet", async () => {
    const app = await makeApp();
    expect((await request(app).delete("/api/snippets/1").set(BOB)).status).toBe(403);
    expect(
      (await request(app).put("/api/snippets/1").set(BOB).send({ title: "x", code: "y", language: "js" })).status
    ).toBe(403);
    expect(state.snippets.get(1).title).toBe("a-private");
  });
});

describe("tags and languages (CP-06)", () => {
  it("anonymous callers see only public snippets' tags and languages", async () => {
    const app = await makeApp();
    expect((await request(app).get("/api/tags")).body).toEqual(["shared-tag"]);
    expect((await request(app).get("/api/languages")).body).toEqual(["go"]);
  });

  it("a signed-in user also sees their own, but not other users' private ones", async () => {
    const app = await makeApp();
    expect((await request(app).get("/api/tags").set(BOB)).body).toEqual(["bob-tag", "shared-tag"]);
    expect((await request(app).get("/api/languages").set(ALICE)).body).toEqual(["go", "python"]);
  });
});

describe("id and query validation (CP-08, CP-09)", () => {
  it.each(["abc", "1.5", "0", "-1", "99999999999", "${}"])("answers 400 for id %s", async (bad) => {
    const app = await makeApp();
    const res = await request(app).get(`/api/snippets/${encodeURIComponent(bad)}`);
    expect(res.status).toBe(400);
  });

  it("answers 400 for bad ids on nested routes", async () => {
    const app = await makeApp();
    expect((await request(app).get("/api/snippets/abc/comments")).status).toBe(400);
    expect((await request(app).post("/api/collections/x/snippets/1").set(BOB)).status).toBe(400);
    expect((await request(app).put("/api/comments/nope").set(BOB).send({ content: "x" })).status).toBe(400);
  });

  it("ignores object-shaped query filters instead of failing", async () => {
    const app = await makeApp();
    const res = await request(app).get("/api/public/snippets?language[a]=b&tag[x]=y");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("unknown API paths are a JSON 404", async () => {
    const app = await makeApp();
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Not found" });
  });
});
