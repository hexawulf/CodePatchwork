import {
  users, type User, type InsertUser,
  snippets, type Snippet, type InsertSnippet,
  collections, type Collection, type CollectionWithCount, type InsertCollection,
  collectionItems, type CollectionItem, type InsertCollectionItem,
  comments, type Comment, type InsertComment,
  type LibraryMeta,
} from "@shared/schema";
import type { CommentView } from "@shared/types";
import { eq, and, or, inArray, isNotNull, ilike, sql, desc, asc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "./db";

/** Escape LIKE/ILIKE wildcards so user input matches literally. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, "\\$&");
}

/** 12 URL-safe characters from the OS random source. */
export function newShareId(): string {
  return randomBytes(9).toString("base64url");
}

export interface SnippetFilters {
  search?: string;
  language?: string | string[];
  tag?: string | string[];
  favorites?: boolean;
  isPublic?: boolean;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;

  getSnippets(filters?: SnippetFilters): Promise<Snippet[]>;
  getSnippet(id: number): Promise<Snippet | undefined>;
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  updateSnippet(id: number, snippet: Omit<InsertSnippet, "userId">): Promise<Snippet>;
  deleteSnippet(id: number): Promise<void>;
  incrementSnippetViewCount(id: number): Promise<void>;
  toggleSnippetFavorite(id: number): Promise<Snippet>;

  getLanguages(userId?: string): Promise<string[]>;
  getTags(userId?: string): Promise<string[]>;
  getMeta(userId?: string): Promise<LibraryMeta>;

  getCollections(userId?: string): Promise<CollectionWithCount[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Omit<InsertCollection, "userId">): Promise<Collection>;
  deleteCollection(id: number): Promise<void>;

  getCollectionSnippets(collectionId: number): Promise<Snippet[]>;
  getSnippetCollectionIds(snippetId: number, userId: string): Promise<number[]>;
  addSnippetToCollection(collectionItem: InsertCollectionItem): Promise<CollectionItem>;
  removeSnippetFromCollection(collectionId: number, snippetId: number): Promise<void>;

  getSnippetByShareId(shareId: string): Promise<Snippet | undefined>;
  generateShareId(snippetId: number): Promise<string>;
  toggleSnippetPublic(snippetId: number): Promise<Snippet>;

  getComment(id: number): Promise<Comment | undefined>;
  getCommentsBySnippetId(snippetId: number): Promise<CommentView[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ─── Users ────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return row;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [row] = await db.insert(users).values(insertUser).returning();
    return row;
  }

  async upsertUser(insertUser: InsertUser): Promise<User> {
    const [row] = await db
      .insert(users)
      .values(insertUser)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: insertUser.email,
          displayName: insertUser.displayName,
          photoURL: insertUser.photoURL,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  // ─── Snippets ─────────────────────────────────────────────────

  async getSnippets(filters?: SnippetFilters): Promise<Snippet[]> {
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(snippets.userId, filters.userId));
    }

    if (filters?.language) {
      if (Array.isArray(filters.language)) {
        if (filters.language.length > 0) {
          conditions.push(inArray(snippets.language, filters.language));
        }
      } else {
        conditions.push(eq(snippets.language, filters.language));
      }
    }

    if (filters?.search) {
      const pattern = `%${escapeLike(filters.search)}%`;
      conditions.push(
        or(
          ilike(snippets.title, pattern),
          ilike(snippets.description, pattern),
          ilike(snippets.code, pattern),
        ),
      );
    }

    if (filters?.tag) {
      if (Array.isArray(filters.tag)) {
        if (filters.tag.length > 0) {
          const items = sql.join(
            filters.tag.map((t) => sql`${t}`),
            sql`, `,
          );
          conditions.push(sql`${snippets.tags} && ARRAY[${items}]::text[]`);
        }
      } else {
        conditions.push(sql`${snippets.tags} @> ARRAY[${filters.tag}]::text[]`);
      }
    }

    if (filters?.favorites) {
      conditions.push(eq(snippets.isFavorite, true));
    }

    if (filters?.isPublic !== undefined) {
      conditions.push(eq(snippets.isPublic, filters.isPublic));
    }

    const base = db.select().from(snippets);
    const filtered = conditions.length > 0 ? base.where(and(...conditions)) : base;
    const ordered = filtered.orderBy(desc(snippets.updatedAt));

    if (filters?.limit !== undefined && filters?.offset !== undefined) {
      return ordered.limit(filters.limit).offset(filters.offset);
    }
    if (filters?.limit !== undefined) {
      return ordered.limit(filters.limit);
    }
    if (filters?.offset !== undefined) {
      return ordered.offset(filters.offset);
    }
    return ordered;
  }

  async getSnippet(id: number): Promise<Snippet | undefined> {
    const [row] = await db.select().from(snippets).where(eq(snippets.id, id)).limit(1);
    return row;
  }

  async createSnippet(snippet: InsertSnippet): Promise<Snippet> {
    const [row] = await db
      .insert(snippets)
      .values({
        title: snippet.title,
        code: snippet.code,
        language: snippet.language,
        description: snippet.description || null,
        tags: snippet.tags || null,
        userId: snippet.userId || null,
        isFavorite: snippet.isFavorite ?? false,
        isPublic: snippet.isPublic ?? false,
      })
      .returning();
    return row;
  }

  async updateSnippet(id: number, snippet: Omit<InsertSnippet, "userId">): Promise<Snippet> {
    const [row] = await db
      .update(snippets)
      .set({
        title: snippet.title,
        code: snippet.code,
        language: snippet.language,
        description: snippet.description || null,
        tags: snippet.tags || null,
        isFavorite: snippet.isFavorite,
        // undefined leaves the column unchanged
        isPublic: snippet.isPublic ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(snippets.id, id))
      .returning();

    if (!row) {
      throw new Error(`Snippet with id ${id} not found`);
    }
    return row;
  }

  async deleteSnippet(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(collectionItems).where(eq(collectionItems.snippetId, id));
      await tx.delete(comments).where(eq(comments.snippetId, id));
      await tx.delete(snippets).where(eq(snippets.id, id));
    });
  }

  async incrementSnippetViewCount(id: number): Promise<void> {
    await db
      .update(snippets)
      .set({ viewCount: sql`${snippets.viewCount} + 1` })
      .where(eq(snippets.id, id));
  }

  async toggleSnippetFavorite(id: number): Promise<Snippet> {
    const [row] = await db
      .update(snippets)
      .set({
        isFavorite: sql`NOT COALESCE(${snippets.isFavorite}, false)`,
        updatedAt: new Date(),
      })
      .where(eq(snippets.id, id))
      .returning();

    if (!row) {
      throw new Error(`Snippet with id ${id} not found`);
    }
    return row;
  }

  // ─── Languages, Tags & Meta ───────────────────────────────────

  /** Public snippets, plus the given user's own. */
  private visibleTo(userId?: string) {
    return userId
      ? or(eq(snippets.isPublic, true), eq(snippets.userId, userId))
      : eq(snippets.isPublic, true);
  }

  async getLanguages(userId?: string): Promise<string[]> {
    const result = await db
      .selectDistinct({ language: snippets.language })
      .from(snippets)
      .where(this.visibleTo(userId));
    return result.map((r) => r.language).filter(Boolean).sort();
  }

  async getTags(userId?: string): Promise<string[]> {
    const rows = await db
      .select({ tags: snippets.tags })
      .from(snippets)
      .where(and(isNotNull(snippets.tags), this.visibleTo(userId)));

    const uniqueTags = new Set<string>();
    for (const row of rows) {
      row.tags?.forEach((tag) => uniqueTags.add(tag));
    }
    return Array.from(uniqueTags).sort();
  }

  /** Aggregated counts for the sidebar & filter bar. */
  async getMeta(userId?: string): Promise<LibraryMeta> {
    const scope = userId ? eq(snippets.userId, userId) : eq(snippets.isPublic, true);

    const rows = await db
      .select({
        language: snippets.language,
        tags: snippets.tags,
        isFavorite: snippets.isFavorite,
        isPublic: snippets.isPublic,
      })
      .from(snippets)
      .where(scope);

    const langCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    let favorites = 0;
    let publicCount = 0;

    for (const row of rows) {
      if (row.language) {
        langCounts.set(row.language, (langCounts.get(row.language) ?? 0) + 1);
      }
      if (row.tags) {
        for (const tag of row.tags) {
          if (tag) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
      if (row.isFavorite) favorites++;
      if (row.isPublic) publicCount++;
    }

    let collectionCount = 0;
    if (userId) {
      const [colRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(collections)
        .where(eq(collections.userId, userId));
      collectionCount = colRow?.count ?? 0;
    }

    const languages = Array.from(langCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const tags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      languages,
      tags,
      counts: {
        total: rows.length,
        favorites,
        public: publicCount,
        collections: collectionCount,
      },
    };
  }

  // ─── Collections ──────────────────────────────────────────────

  async getCollections(userId?: string): Promise<CollectionWithCount[]> {
    const base = db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        userId: collections.userId,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        snippetCount: sql<number>`count(${collectionItems.id})::int`,
      })
      .from(collections)
      .leftJoin(collectionItems, eq(collections.id, collectionItems.collectionId));

    const query = userId ? base.where(eq(collections.userId, userId)) : base;
    return query.groupBy(collections.id).orderBy(desc(collections.updatedAt));
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const [row] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
    return row;
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [row] = await db.insert(collections).values(collection).returning();
    return row;
  }

  async updateCollection(id: number, collection: Omit<InsertCollection, "userId">): Promise<Collection> {
    const [row] = await db
      .update(collections)
      .set({
        name: collection.name,
        description: collection.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, id))
      .returning();

    if (!row) {
      throw new Error(`Collection with id ${id} not found`);
    }
    return row;
  }

  async deleteCollection(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(collectionItems).where(eq(collectionItems.collectionId, id));
      await tx.delete(collections).where(eq(collections.id, id));
    });
  }

  async getCollectionSnippets(collectionId: number): Promise<Snippet[]> {
    const result = await db
      .select()
      .from(snippets)
      .innerJoin(collectionItems, eq(snippets.id, collectionItems.snippetId))
      .where(eq(collectionItems.collectionId, collectionId))
      .orderBy(desc(snippets.updatedAt));

    return result.map((row) => ({ ...row.snippets }));
  }

  async getSnippetCollectionIds(snippetId: number, userId: string): Promise<number[]> {
    const rows = await db
      .select({ collectionId: collectionItems.collectionId })
      .from(collectionItems)
      .innerJoin(collections, eq(collections.id, collectionItems.collectionId))
      .where(and(eq(collectionItems.snippetId, snippetId), eq(collections.userId, userId)));
    return rows.map((r) => r.collectionId);
  }

  async addSnippetToCollection(collectionItem: InsertCollectionItem): Promise<CollectionItem> {
    const [existing] = await db
      .select()
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionItem.collectionId),
          eq(collectionItems.snippetId, collectionItem.snippetId),
        ),
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    const [row] = await db.insert(collectionItems).values(collectionItem).returning();
    return row;
  }

  async removeSnippetFromCollection(collectionId: number, snippetId: number): Promise<void> {
    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.snippetId, snippetId),
        ),
      );
  }

  // ─── Sharing ──────────────────────────────────────────────────

  async getSnippetByShareId(shareId: string): Promise<Snippet | undefined> {
    const [row] = await db.select().from(snippets).where(eq(snippets.shareId, shareId)).limit(1);
    return row;
  }

  async generateShareId(snippetId: number): Promise<string> {
    const shareId = newShareId();
    await db.update(snippets).set({ shareId }).where(eq(snippets.id, snippetId));
    return shareId;
  }

  async toggleSnippetPublic(snippetId: number): Promise<Snippet> {
    const current = await this.getSnippet(snippetId);
    if (!current) {
      throw new Error(`Snippet with ID ${snippetId} not found`);
    }

    const isPublic = !current.isPublic;
    const shareId = isPublic && !current.shareId ? newShareId() : current.shareId;

    const [updated] = await db
      .update(snippets)
      .set({ isPublic, shareId })
      .where(eq(snippets.id, snippetId))
      .returning();

    return updated;
  }

  // ─── Comments ─────────────────────────────────────────────────

  async getComment(id: number): Promise<Comment | undefined> {
    const [row] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return row;
  }

  async getCommentsBySnippetId(snippetId: number): Promise<CommentView[]> {
    const rows = await db
      .select({
        id: comments.id,
        snippetId: comments.snippetId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        displayName: users.displayName,
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.userId))
      .where(eq(comments.snippetId, snippetId))
      .orderBy(asc(comments.createdAt));
    return rows.map(({ displayName, ...c }) => ({
      ...c,
      authorName: displayName?.trim() || "Anonymous",
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment> {
    const [updated] = await db
      .update(comments)
      .set({ ...comment, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Comment with ID ${id} not found`);
    }
    return updated;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }
}

export const storage = new DatabaseStorage();
