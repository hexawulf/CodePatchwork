-- Create collectionItems table if it doesn't exist
CREATE TABLE IF NOT EXISTS "collectionItems" (
    id SERIAL PRIMARY KEY,
    collectionId INTEGER NOT NULL,
    snippetId INTEGER NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collectionId, snippetId)
);

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    snippetId INTEGER NOT NULL,
    userId VARCHAR,
    content TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_collectionitems_collectionid ON "collectionItems"(collectionId);
CREATE INDEX IF NOT EXISTS idx_collectionitems_snippetid ON "collectionItems"(snippetId);
CREATE INDEX IF NOT EXISTS idx_comments_snippetid ON comments(snippetId);


-- Create the collectionItems table (case-sensitive name, requires double quotes)
CREATE TABLE IF NOT EXISTS "collectionItems" (
    id SERIAL PRIMARY KEY,
    collectionId INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    snippetId INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collectionId, snippetId)
);

-- Create the comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    snippetId INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
    userId VARCHAR,
    content TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collectionitems_collectionid ON "collectionItems"("collectionId");
CREATE INDEX IF NOT EXISTS idx_collectionitems_snippetid ON "collectionItems"("snippetId");
CREATE INDEX IF NOT EXISTS idx_comments_snippetid ON comments("snippetId");
