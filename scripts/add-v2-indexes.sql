-- CodePatchwork v2.0 non-destructive performance indexes.
-- Safe to run repeatedly on an existing PostgreSQL database.

BEGIN;

-- Deduplicate any legacy collectionItems pairs before creating the unique index.
DELETE FROM "collectionItems" a
USING "collectionItems" b
WHERE a.id > b.id
  AND a.collectionid = b.collectionid
  AND a.snippetid = b.snippetid;

CREATE INDEX IF NOT EXISTS snippets_userid_updatedat_idx
  ON snippets (userid, updatedat DESC);

CREATE INDEX IF NOT EXISTS snippets_ispublic_updatedat_idx
  ON snippets (ispublic, updatedat DESC);

CREATE INDEX IF NOT EXISTS snippets_tags_gin_idx
  ON snippets USING gin (tags);

CREATE INDEX IF NOT EXISTS collections_userid_idx
  ON collections (userid);

CREATE UNIQUE INDEX IF NOT EXISTS collection_items_collection_snippet_uidx
  ON "collectionItems" (collectionid, snippetid);

CREATE INDEX IF NOT EXISTS collection_items_snippet_idx
  ON "collectionItems" (snippetid);

CREATE INDEX IF NOT EXISTS comments_snippetid_createdat_idx
  ON comments (snippetid, createdat ASC);

COMMIT;
