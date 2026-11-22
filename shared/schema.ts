import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
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
export const snippets = pgTable(
  "snippets",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    code: text("code").notNull(),
    language: text("language").notNull(),
    tags: text("tags").array(),
    userId: text("userid"),
    createdAt: timestamp("createdat", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow().notNull(),
    viewCount: integer("viewcount").default(0),
    isFavorite: boolean("isfavorite").default(false),
    shareId: text("shareid").unique(),
    isPublic: boolean("ispublic").default(false),
  },
  (table) => [
    index("snippets_userid_updatedat_idx").on(table.userId, table.updatedAt),
    index("snippets_ispublic_updatedat_idx").on(table.isPublic, table.updatedAt),
    index("snippets_tags_gin_idx").using("gin", table.tags),
  ],
);

export const insertSnippetSchema = createInsertSchema(snippets)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    shareId: true,
  })
  .partial({
    viewCount: true,
    isPublic: true,
  });

export type InsertSnippet = z.infer<typeof insertSnippetSchema>;
export type Snippet = typeof snippets.$inferSelect;

// Collections schema - Maps DB columns to TS properties
export const collections = pgTable(
  "collections",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    userId: text("userid"),
    createdAt: timestamp("createdat", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("collections_userid_idx").on(table.userId)],
);

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type CollectionWithCount = Collection & { snippetCount: number };

// Collection Items - Maps live DB table "collectionItems" & lowercase columns to TS properties
export const collectionItems = pgTable(
  "collectionItems",
  {
    id: serial("id").primaryKey(),
    collectionId: integer("collectionid").notNull(),
    snippetId: integer("snippetid").notNull(),
    createdAt: timestamp("createdat", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("collection_items_collection_snippet_uidx").on(
      table.collectionId,
      table.snippetId,
    ),
    index("collection_items_snippet_idx").on(table.snippetId),
  ],
);

export const insertCollectionItemSchema = createInsertSchema(collectionItems).omit({
  id: true,
  createdAt: true,
});

export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;
export type CollectionItem = typeof collectionItems.$inferSelect;

// Comments schema - Maps DB columns to TS properties
export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    snippetId: integer("snippetid").notNull(),
    content: text("content").notNull(),
    userId: text("userid"),
    createdAt: timestamp("createdat", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("comments_snippetid_createdat_idx").on(table.snippetId, table.createdAt)],
);

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export interface LibraryMeta {
  languages: { name: string; count: number }[];
  tags: { name: string; count: number }[];
  counts: {
    total: number;
    favorites: number;
    public: number;
    collections: number;
  };
}
