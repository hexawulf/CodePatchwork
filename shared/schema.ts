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

// Snippet schema - FIXED to match database exactly
export const snippets = pgTable("snippets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  language: text("language").notNull(),
  tags: text("tags").array(),
  userId: text("userid"), // FIXED: Match database column "userid"
  createdAt: timestamp("createdat").defaultNow().notNull(), // FIXED: Match database column "createdat"
  updatedAt: timestamp("updatedat").defaultNow().notNull(), // FIXED: Match database column "updatedat"
  viewCount: integer("viewcount").default(0), // FIXED: Match database column "viewcount"
  isFavorite: boolean("isfavorite").default(false), // FIXED: Match database column "isfavorite"
  shareId: text("shareid").unique(), // FIXED: Match database column "shareid"
  isPublic: boolean("ispublic").default(false), // FIXED: Match database column "ispublic"
});

export const insertSnippetSchema = createInsertSchema(snippets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  shareId: true,
  isPublic: true
});

export type InsertSnippet = z.infer<typeof insertSnippetSchema>;
export type Snippet = typeof snippets.$inferSelect;

// Collections schema - FIXED to match database exactly
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("userid"), // FIXED: Match database column "userid"
  createdAt: timestamp("createdat").defaultNow().notNull(), // FIXED: Match database column "createdat"
  updatedAt: timestamp("updatedat").defaultNow().notNull(), // FIXED: Match database column "updatedat"
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

// Collection Items (for associating snippets with collections)
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

// Comments schema - FIXED to match actual database structure
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  snippetId: integer("snippetid").notNull(), // FIXED: Match database column "snippetid"
  content: text("content").notNull(),
  userId: text("userid"), // FIXED: Match database column "userid"
  createdAt: timestamp("createdat").defaultNow().notNull(), // FIXED: Match database column "createdat"
  updatedAt: timestamp("updatedat").defaultNow().notNull(), // FIXED: Match database column "updatedat"
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
