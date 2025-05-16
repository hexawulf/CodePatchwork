#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('Pushing database schema to PostgreSQL...');
try {
  execSync('npx drizzle-kit push:pg', { stdio: 'inherit' });
  console.log('Database schema successfully updated!');
} catch (error) {
  console.error('Error pushing schema:', error);
  process.exit(1);
}