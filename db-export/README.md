# CodePatchwork Database Migration

This folder contains database export files to migrate your CodePatchwork database to a local PostgreSQL instance.

## Files

- `schema.sql`: Database schema definition (tables, constraints, etc.)
- `data.sql`: Database data only (no schema)
- `complete_dump.dump`: Complete database export in PostgreSQL custom format

## Import Instructions

### Option 1: Using the complete dump (recommended)

1. Create a new database:
   ```bash
   createdb codepatchwork
   ```

2. Import the complete dump:
   ```bash
   pg_restore -d codepatchwork --no-owner --role=your_username complete_dump.dump
   ```

### Option 2: Using separate schema and data files

1. Create a new database:
   ```bash
   createdb codepatchwork
   ```

2. Import the schema:
   ```bash
   psql -d codepatchwork -f schema.sql
   ```

3. Import the data:
   ```bash
   psql -d codepatchwork -f data.sql
   ```

## Database Configuration

After import, update your local .env file with:

```
DATABASE_URL=postgres://your_username:your_password@localhost:5432/codepatchwork
```

Replace `your_username` and `your_password` with your local PostgreSQL credentials.
