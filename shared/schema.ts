import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Firebase UID
  email: text("email").unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Snippet schema - Maps DB columns to TS properties
export const snippets = pgTable("snippets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  language: text("language").notNull(),
  tags: text("tags").array(),
  userId: text("userid"), // TS property "userId" maps to DB column "userid"
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow().notNull(), // TS "createdAt" → DB "createdat"
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow().notNull(), // TS "updatedAt" → DB "updatedat"
  viewCount: integer("viewcount").default(0), // TS "viewCount" → DB "viewcount"
  isFavorite: boolean("isfavorite").default(false), // TS "isFavorite" → DB "isfavorite"
  shareId: text("shareid").unique(), // TS "shareId" → DB "shareid"
  isPublic: boolean("ispublic").default(false), // TS "isPublic" → DB "ispublic"
});

export const insertSnippetSchema = createInsertSchema(snippets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  shareId: true,
}).partial({
  viewCount: true,
  isPublic: true,
});

export type InsertSnippet = z.infer<typeof insertSnippetSchema>;
export type Snippet = typeof snippets.$inferSelect;

// Collections schema - Maps DB columns to TS properties
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("userid"), // TS property "userId" maps to DB column "userid"
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow().notNull(), // TS "createdAt" → DB "createdat"
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow().notNull(), // TS "updatedAt" → DB "updatedat"
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

// Collection Items
export const collectionItems = pgTable("collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull(),
  snippetId: integer("snippet_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCollectionItemSchema = createInsertSchema(collectionItems).omit({
  id: true,
  createdAt: true
});

export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;
export type CollectionItem = typeof collectionItems.$inferSelect;

// Comments schema - Maps DB columns to TS properties
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  snippetId: integer("snippetid").notNull(), // TS "snippetId" → DB "snippetid"
  content: text("content").notNull(),
  userId: text("userid"), // TS "userId" → DB "userid"
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow().notNull(), // TS "createdAt" → DB "createdat"
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow().notNull(), // TS "updatedAt" → DB "updatedat"
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
