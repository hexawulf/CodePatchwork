-- Check the actual column names in collectionItems
\d "collectionItems"

-- Check the actual column names in comments
\d comments

-- Create indices with the correct column names
DROP INDEX IF EXISTS idx_collectionitems_collectionid;
DROP INDEX IF EXISTS idx_collectionitems_snippetid;
DROP INDEX IF EXISTS idx_comments_snippetid;

CREATE INDEX IF NOT EXISTS idx_collectionitems_collectionid ON "collectionItems"(collectionid);
CREATE INDEX IF NOT EXISTS idx_collectionitems_snippetid ON "collectionItems"(snippetid);
CREATE INDEX IF NOT EXISTS idx_comments_snippetid ON comments(snippetid);
