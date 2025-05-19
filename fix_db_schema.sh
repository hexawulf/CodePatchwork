#!/bin/bash

# CodePatchwork Database Schema Fix Script
# This script fixes schema issues with the users table

set -e  # Exit immediately if a command exits with a non-zero status

echo "🔧 Starting CodePatchwork database schema fix..."

# Check if DATABASE_URL environment variable is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set."
  echo "Please set the DATABASE_URL variable before running this script."
  exit 1
fi

# Create SQL script to fix the issues
SQL_FIX=$(cat << 'EOF'
-- Fix users table schema to match the application requirements
ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS email VARCHAR,
ADD COLUMN IF NOT EXISTS displayName VARCHAR,
ADD COLUMN IF NOT EXISTS photoURL VARCHAR;

-- Add missing sessions table if not exists
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Update schema version in the _drizzle_migrations table if it exists
UPDATE _drizzle_migrations
SET checksum = 'updated', 
    applied_at = NOW()
WHERE id = (SELECT MAX(id) FROM _drizzle_migrations)
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_drizzle_migrations');

EOF
)

# Execute the SQL to fix the schema
echo "🛠️ Applying schema fixes to the database..."
echo "$SQL_FIX" | PGPASSWORD="${DATABASE_URL#*:*:}" psql "${DATABASE_URL}"

echo ""
echo "✅ Database schema fix completed!"
echo ""
echo "The following changes were made:"
echo "- Added 'email' column to users table if missing"
echo "- Added 'displayName' column to users table if missing" 
echo "- Added 'photoURL' column to users table if missing"
echo "- Created sessions table if missing"
echo "- Updated schema version in _drizzle_migrations (if table exists)"
echo ""
echo "Next steps:"
echo "1. Restart your application"
echo "2. Authentication should now work properly"
echo ""
echo "Thank you for using CodePatchwork! 🎉"
