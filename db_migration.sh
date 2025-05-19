#!/bin/bash

# CodePatchwork Database Migration Script
# This script exports database schema and data for local PostgreSQL import

set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting CodePatchwork database migration..."

# Check if DATABASE_URL environment variable is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set."
  echo "Please set the DATABASE_URL variable before running this script."
  exit 1
fi

# Create an export directory if it doesn't exist
EXPORT_DIR="./db-export"
mkdir -p "$EXPORT_DIR"

echo "📂 Created export directory at $EXPORT_DIR"

# Extract database connection details from DATABASE_URL
# Format: postgres://username:password@host:port/database
# Extract database connection details from DATABASE_URL
# Format: postgresql://username:password@host:port/database
if [[ "$DATABASE_URL" == postgresql://* ]]; then
  DB_URL=${DATABASE_URL#postgresql://}
else
  DB_URL=${DATABASE_URL#postgres://}
fi

DB_USER=$(echo $DB_URL | cut -d':' -f1)
DB_PASS=$(echo $DB_URL | cut -d':' -f2 | cut -d'@' -f1)
DB_HOST_PORT=$(echo $DB_URL | cut -d'@' -f2 | cut -d'/' -f1)
DB_HOST=$(echo $DB_HOST_PORT | cut -d':' -f1)
DB_PORT=$(echo $DB_HOST_PORT | cut -d':' -f2)
DB_NAME=$(echo $DB_URL | cut -d'/' -f2 | cut -d'?' -f1)

echo "ℹ️ Detected database: $DB_NAME on $DB_HOST:$DB_PORT"
# Export schema (structure only, no data)
echo "📤 Exporting database schema..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --schema-only \
  --no-owner \
  --no-acl \
  --format=plain \
  > "$EXPORT_DIR/schema.sql"

echo "✅ Schema exported to $EXPORT_DIR/schema.sql"

# Export data (all tables, no schema)
echo "📤 Exporting database data..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --data-only \
  --no-owner \
  --no-acl \
  --format=plain \
  > "$EXPORT_DIR/data.sql"

echo "✅ Data exported to $EXPORT_DIR/data.sql"

# Create a complete dump (schema + data)
echo "📤 Creating complete database dump..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --format=custom \
  > "$EXPORT_DIR/complete_dump.dump"

echo "✅ Complete dump created at $EXPORT_DIR/complete_dump.dump"

# Create a README file with import instructions
cat > "$EXPORT_DIR/README.md" << EOF
# CodePatchwork Database Migration

This folder contains database export files to migrate your CodePatchwork database to a local PostgreSQL instance.

## Files

- \`schema.sql\`: Database schema definition (tables, constraints, etc.)
- \`data.sql\`: Database data only (no schema)
- \`complete_dump.dump\`: Complete database export in PostgreSQL custom format

## Import Instructions

### Option 1: Using the complete dump (recommended)

1. Create a new database:
   \`\`\`bash
   createdb codepatchwork
   \`\`\`

2. Import the complete dump:
   \`\`\`bash
   pg_restore -d codepatchwork --no-owner --role=your_username complete_dump.dump
   \`\`\`

### Option 2: Using separate schema and data files

1. Create a new database:
   \`\`\`bash
   createdb codepatchwork
   \`\`\`

2. Import the schema:
   \`\`\`bash
   psql -d codepatchwork -f schema.sql
   \`\`\`

3. Import the data:
   \`\`\`bash
   psql -d codepatchwork -f data.sql
   \`\`\`

## Database Configuration

After import, update your local .env file with:

\`\`\`
DATABASE_URL=postgres://your_username:your_password@localhost:5432/codepatchwork
\`\`\`

Replace \`your_username\` and \`your_password\` with your local PostgreSQL credentials.
EOF

echo "✅ README with import instructions created at $EXPORT_DIR/README.md"

# Create a zip file of all exported files
ZIP_FILE="codepatchwork-db-export.zip"
echo "🔒 Creating zip archive of all export files..."
(cd "$EXPORT_DIR" && zip -r "../$ZIP_FILE" .)

echo ""
echo "✅ Database migration completed!"
echo ""
echo "📦 All files are exported to: $EXPORT_DIR/"
echo "📦 Zip archive created: $ZIP_FILE"
echo ""
echo "Next steps:"
echo "1. Download the zip archive to your local machine"
echo "2. Follow the instructions in $EXPORT_DIR/README.md to import the database"
echo ""
echo "Thank you for using CodePatchwork! 🎉"
