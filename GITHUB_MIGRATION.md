# GitHub Migration Guide for CodePatchwork

This guide provides step-by-step instructions for migrating CodePatchwork from Replit to GitHub.

## Prerequisites

- A GitHub account
- Git installed on your local machine
- Basic knowledge of Git and GitHub

## Step 1: Create a GitHub Repository

1. Log in to your GitHub account
2. Click the "+" icon in the top-right corner and select "New repository"
3. Name the repository "CodePatchwork"
4. Add a description: "A visual code snippet management application inspired by Pinterest"
5. Choose "Public" for the repository visibility
6. Check "Add a README file"
7. Select "MIT License" from the "Add a license" dropdown
8. Click "Create repository"

## Step 2: Clone the Repository Locally

```bash
git clone https://github.com/hexawulf/CodePatchwork.git
cd CodePatchwork
```

## Step 3: Export Code from Replit

There are two approaches to export your code from Replit:

### Option A: Use the Migration Script (Recommended)

1. Download the entire Replit project as a ZIP file (using the "Download as ZIP" option)
2. Extract the ZIP to a temporary location
3. Navigate to the extracted folder
4. Run the migration script:

```bash
./scripts/github-migration.sh
```

### Option B: Manual Migration

1. Clone the GitHub repository locally
2. Copy all files from Replit to your local repository (excluding `.replit`, `.cache`, etc.)
3. Initialize git and commit changes:

```bash
git init
git add .
git commit -m "Initial commit: CodePatchwork v1.0"
git remote add origin https://github.com/hexawulf/CodePatchwork.git
```

## Step 4: Push to GitHub

```bash
git push -u origin main
```

## Step 5: Tag the Release

```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

## Step 6: Set Up GitHub Actions

1. Ensure the `.github/workflows/ci.yml` file is included in your repository
2. GitHub Actions will automatically run based on the workflow configuration

## Step 7: Update Repository Settings

1. Go to your repository's "Settings" tab on GitHub
2. Configure branch protection rules for the main branch
3. Set up GitHub Pages if you want to host documentation
4. Add collaborators if needed

## Additional Steps

### Update package.json

Make sure your `package.json` has the correct repository information:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/hexawulf/CodePatchwork.git"
},
"author": "0xWulf <dev@0xwulf.dev>",
"license": "MIT",
```

### Create GitHub Issues for Future Features

Consider creating GitHub issues for planned features:

1. Advanced tagging system
2. Enhanced collection management
3. User preference persistence
4. Mobile application integration
5. Collaboration features

## Troubleshooting

- If you encounter issues with large files, consider setting up Git LFS
- For database migration issues, refer to the database migration scripts in the `scripts` directory
- Contact the repository owner at dev@0xwulf.dev for assistance

---

*This migration guide was created by 0xWulf (dev@0xwulf.dev) for CodePatchwork v1.0.0*