import {
  users, type User, type InsertUser,
  snippets, type Snippet, type InsertSnippet,
  collections, type Collection, type InsertCollection,
  collectionItems, type CollectionItem, type InsertCollectionItem,
  comments, type Comment, type InsertComment
} from "@shared/schema";
import { eq, and, or, isNotNull, ilike, sql, desc, asc } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;

  getSnippets(filters?: {
    search?: string;
    language?: string | string[];
    tag?: string | string[];
    favorites?: boolean;
    isPublic?: boolean;
    userId?: string;
  }): Promise<Snippet[]>;
  getSnippet(id: number): Promise<Snippet | undefined>;
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  updateSnippet(id: number, snippet: InsertSnippet): Promise<Snippet>;
  deleteSnippet(id: number): Promise<void>;
  incrementSnippetViewCount(id: number): Promise<void>;
  toggleSnippetFavorite(id: number): Promise<Snippet>;

  getLanguages(): Promise<string[]>;
  getTags(): Promise<string[]>;

  getCollections(userId?: string): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: InsertCollection): Promise<Collection>;
  deleteCollection(id: number): Promise<void>;

  getCollectionSnippets(collectionId: number): Promise<Snippet[]>;
  addSnippetToCollection(collectionItem: InsertCollectionItem): Promise<CollectionItem>;
  removeSnippetFromCollection(collectionId: number, snippetId: number): Promise<void>;

  getSnippetByShareId(shareId: string): Promise<Snippet | undefined>;
  generateShareId(snippetId: number): Promise<string>;
  toggleSnippetPublic(snippetId: number): Promise<Snippet>;

  getComment(id: number): Promise<Comment | undefined>;
  getCommentsBySnippetId(snippetId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {

  // ─── Users ────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async upsertUser(insertUser: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(insertUser)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...insertUser,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  // ─── Snippets ─────────────────────────────────────────────────

  async getSnippets(filters?: {
    search?: string;
    language?: string | string[];
    tag?: string | string[];
    favorites?: boolean;
    isPublic?: boolean;
    userId?: string;
  }): Promise<Snippet[]> {
    const conditions = [];

    if (filters) {
      if (filters.userId) {
        conditions.push(eq(snippets.userId, filters.userId));
      }

      if (filters.language) {
        if (Array.isArray(filters.language)) {
          const langConds = filters.language.map((lang) => eq(snippets.language, lang));
          if (langConds.length > 0) {
            conditions.push(or(...langConds));
          }
        } else {
          conditions.push(eq(snippets.language, filters.language));
        }
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(snippets.title, `%${filters.search}%`),
            ilike(snippets.code, `%${filters.search}%`)
          )
        );
      }

      if (filters.tag) {
        if (Array.isArray(filters.tag)) {
          conditions.push(sql`${snippets.tags} && ARRAY[${filters.tag}]::text[]`);
        } else {
          conditions.push(sql`${snippets.tags} @> ARRAY[${filters.tag}]::text[]`);
        }
      }

      if (filters.favorites) {
        conditions.push(eq(snippets.isFavorite, true));
      }

      if (filters.isPublic !== undefined) {
        conditions.push(eq(snippets.isPublic, filters.isPublic));
      }
    }

    if (conditions.length > 0) {
      return db.select().from(snippets).where(and(...conditions)).orderBy(desc(snippets.updatedAt));
    }

    return db.select().from(snippets).orderBy(desc(snippets.updatedAt));
  }

  async getSnippet(id: number): Promise<Snippet | undefined> {
    const result = await db.select().from(snippets).where(eq(snippets.id, id)).limit(1);
    return result[0];
  }

  async createSnippet(snippet: InsertSnippet): Promise<Snippet> {
    const result = await db
      .insert(snippets)
      .values({
        title: snippet.title,
        code: snippet.code,
        language: snippet.language,
        description: snippet.description || null,
        tags: snippet.tags || null,
        userId: snippet.userId || null,
        isFavorite: snippet.isFavorite ?? false,
      })
      .returning();
    return result[0];
  }

  async updateSnippet(id: number, snippet: InsertSnippet): Promise<Snippet> {
    const result = await db
      .update(snippets)
      .set({
        title: snippet.title,
        code: snippet.code,
        language: snippet.language,
        description: snippet.description || null,
        tags: snippet.tags || null,
        isFavorite: snippet.isFavorite,
        updatedAt: new Date(),
      })
      .where(eq(snippets.id, id))
      .returning();

    if (!result[0]) {
      throw new Error(`Snippet with id ${id} not found`);
    }
    return result[0];
  }

  async deleteSnippet(id: number): Promise<void> {
    await db.delete(collectionItems).where(eq(collectionItems.snippetId, id));
    await db.delete(comments).where(eq(comments.snippetId, id));
    await db.delete(snippets).where(eq(snippets.id, id));
  }

  async incrementSnippetViewCount(id: number): Promise<void> {
    await db
      .update(snippets)
      .set({ viewCount: sql`${snippets.viewCount} + 1` })
      .where(eq(snippets.id, id));
  }

  async toggleSnippetFavorite(id: number): Promise<Snippet> {
    const existing = await this.getSnippet(id);
    if (!existing) {
      throw new Error(`Snippet with id ${id} not found`);
    }

    const result = await db
      .update(snippets)
      .set({ isFavorite: !existing.isFavorite, updatedAt: new Date() })
      .where(eq(snippets.id, id))
      .returning();

    return result[0];
  }

  // ─── Languages & Tags ────────────────────────────────────────

  async getLanguages(): Promise<string[]> {
    const result = await db
      .selectDistinct({ language: snippets.language })
      .from(snippets);
    return result.map((r) => r.language).filter(Boolean);
  }

  async getTags(): Promise<string[]> {
    const allTags = await db
      .select({ tags: snippets.tags })
      .from(snippets)
      .where(isNotNull(snippets.tags));

    const uniqueTags = new Set<string>();
    allTags.forEach((row) => {
      row.tags?.forEach((tag) => uniqueTags.add(tag));
    });
    return Array.from(uniqueTags).sort();
  }

  // ─── Collections ──────────────────────────────────────────────

  async getCollections(userId?: string): Promise<Collection[]> {
    if (userId) {
      return await db.select().from(collections).where(eq(collections.userId, userId));
    }
    return await db.select().from(collections);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const result = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
    return result[0];
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const result = await db.insert(collections).values(collection).returning();
    return result[0];
  }

  async updateCollection(id: number, collection: InsertCollection): Promise<Collection> {
    const result = await db
      .update(collections)
      .set({ ...collection, updatedAt: new Date() })
      .where(eq(collections.id, id))
      .returning();

    if (!result[0]) {
      throw new Error(`Collection with id ${id} not found`);
    }
    return result[0];
  }

  async deleteCollection(id: number): Promise<void> {
    await db.delete(collectionItems).where(eq(collectionItems.collectionId, id));
    await db.delete(collections).where(eq(collections.id, id));
  }

  async getCollectionSnippets(collectionId: number): Promise<Snippet[]> {
    const result = await db
      .select()
      .from(snippets)
      .innerJoin(collectionItems, eq(snippets.id, collectionItems.snippetId))
      .where(eq(collectionItems.collectionId, collectionId));

    return result.map((row) => ({ ...row.snippets }));
  }

  async addSnippetToCollection(collectionItem: InsertCollectionItem): Promise<CollectionItem> {
    const existing = await db
      .select()
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionItem.collectionId),
          eq(collectionItems.snippetId, collectionItem.snippetId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db
      .insert(collectionItems)
      .values(collectionItem)
      .returning();

    return result[0];
  }

  async removeSnippetFromCollection(collectionId: number, snippetId: number): Promise<void> {
    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.snippetId, snippetId)
        )
      );
  }

  // ─── Sharing ──────────────────────────────────────────────────

  async getSnippetByShareId(shareId: string): Promise<Snippet | undefined> {
    const result = await db
      .select()
      .from(snippets)
      .where(eq(snippets.shareId, shareId))
      .limit(1);
    return result[0];
  }

  async generateShareId(snippetId: number): Promise<string> {
    const shareId = Math.random().toString(36).substring(2, 10);
    await db
      .update(snippets)
      .set({ shareId })
      .where(eq(snippets.id, snippetId));
    return shareId;
  }

  async toggleSnippetPublic(snippetId: number): Promise<Snippet> {
    const current = await this.getSnippet(snippetId);
    if (!current) {
      throw new Error(`Snippet with ID ${snippetId} not found`);
    }

    const isPublic = !current.isPublic;
    let shareId = current.shareId;
    if (isPublic && !shareId) {
      shareId = Math.random().toString(36).substring(2, 10);
    }

    const [updated] = await db
      .update(snippets)
      .set({ isPublic, shareId })
      .where(eq(snippets.id, snippetId))
      .returning();

    return updated;
  }

  // ─── Comments ─────────────────────────────────────────────────

  async getComment(id: number): Promise<Comment | undefined> {
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);
    return result[0];
  }

  async getCommentsBySnippetId(snippetId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.snippetId, snippetId))
      .orderBy(asc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
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
