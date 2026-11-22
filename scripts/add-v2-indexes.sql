-- CodePatchwork v2.0 non-destructive performance indexes.
-- Safe to run repeatedly on an existing PostgreSQL database.

BEGIN;

-- Deduplicate any legacy collection_items pairs before creating the unique index.
DELETE FROM collection_items a
USING collection_items b
WHERE a.id > b.id
  AND a.collection_id = b.collection_id
  AND a.snippet_id = b.snippet_id;

CREATE INDEX IF NOT EXISTS snippets_userid_updatedat_idx
  ON snippets (userid, updatedat DESC);

CREATE INDEX IF NOT EXISTS snippets_ispublic_updatedat_idx
  ON snippets (ispublic, updatedat DESC);

CREATE INDEX IF NOT EXISTS snippets_tags_gin_idx
  ON snippets USING gin (tags);

CREATE INDEX IF NOT EXISTS collections_userid_idx
  ON collections (userid);

CREATE UNIQUE INDEX IF NOT EXISTS collection_items_collection_snippet_uidx
  ON collection_items (collection_id, snippet_id);

CREATE INDEX IF NOT EXISTS collection_items_snippet_idx
  ON collection_items (snippet_id);

CREATE INDEX IF NOT EXISTS comments_snippetid_createdat_idx
  ON comments (snippetid, createdat ASC);

COMMIT;
