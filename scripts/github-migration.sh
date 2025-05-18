#!/bin/bash

# CodePatchwork GitHub Migration Script
# This script helps prepare the CodePatchwork project for GitHub migration
# It will initialize Git, add all files, create an initial commit, and set the remote

set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 Preparing CodePatchwork for GitHub migration..."

# Make sure we're in the root directory
ROOT_DIR=$(pwd)

# Check if .git directory already exists
if [ -d ".git" ]; then
  echo "ℹ️ Git repository already initialized."
else
  # Initialize git repository
  echo "📁 Initializing Git repository..."
  git init
fi

# Add all files (excluding those in .gitignore)
echo "📝 Adding files to Git repository..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: CodePatchwork v1.0"

# Check if remote already exists
if git remote | grep -q "origin"; then
  # Update remote if it exists
  echo "🔄 Updating remote origin..."
  git remote set-url origin https://github.com/hexawulf/CodePatchwork.git
else
  # Add remote if it doesn't exist
  echo "🔗 Adding remote origin..."
  git remote add origin https://github.com/hexawulf/CodePatchwork.git
fi

# Display next steps
echo ""
echo "✅ Git repository preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub with:"
echo "   git push -u origin main"
echo ""
echo "2. To tag this version with v1.0.0:"
echo "   git tag -a v1.0.0 -m \"First stable release\""
echo "   git push origin v1.0.0"
echo ""
echo "Your project is now ready for GitHub migration! 🎉"