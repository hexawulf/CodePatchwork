# CodePatchwork GitHub Migration Guide

This document provides instructions for migrating the CodePatchwork project to GitHub. Follow these steps to complete the migration process.

## Prerequisites

Before starting the migration process, ensure you have:

1. A GitHub account
2. [Git](https://git-scm.com/) installed on your computer
3. The GitHub repository already created at: https://github.com/hexawolf/CodePatchwork
4. A local copy of the CodePatchwork project

## Step 1: Prepare Your Environment Variables

Before migrating to GitHub, create a `.env.example` file that shows the required environment variables without actual values. This helps other contributors set up their environment correctly.

```
# PostgreSQL Database
DATABASE_URL=postgres://username:password@localhost:5432/codepatchwork

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
```

## Step 2: Run the Migration Script

We've provided a migration script to simplify the process. This script will:

- Initialize a Git repository (if one doesn't exist)
- Add all files to Git
- Create an initial commit
- Set up the GitHub remote

Run the script with:

```bash
./scripts/github-migration.sh
```

## Step 3: Push to GitHub

After running the migration script, push the code to GitHub:

```bash
# Push to the main branch
git push -u origin main
```

## Step 4: Create a Version Tag

To tag this as version 1.0.0:

```bash
# Create an annotated tag
git tag -a v1.0.0 -m "First stable release"

# Push the tag to GitHub
git push origin v1.0.0
```

## Step 5: Configure GitHub Repository Settings

After pushing your code, configure your GitHub repository settings:

1. **Branch Protection:** Go to Settings > Branches and add protection rules for the main branch
2. **GitHub Pages:** If you want to set up a project website, configure GitHub Pages in Settings > Pages
3. **GitHub Actions:** Check that the CI workflow is properly set up in the Actions tab

## Step 6: Set Up GitHub Secrets

To enable CI/CD with Firebase, add the following secrets to your GitHub repository:

1. Go to Settings > Secrets and variables > Actions
2. Add the following repository secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`

## Database Schema Issues

If you encounter database schema issues when deploying to a new environment, run the database migration script:

```bash
node scripts/fix-database-schema.js
```

## Next Steps

After migration, consider:

- Setting up project boards for task management
- Creating issue templates
- Adding more detailed documentation in the Wiki
- Setting up automated releases
- Creating a development branch for ongoing work

---

Congratulations! Your project is now on GitHub and ready for collaboration.