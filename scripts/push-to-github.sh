#!/bin/bash
# Manual push script to GitHub
# Usage: ./scripts/push-to-github.sh [branch-name]

BRANCH=${1:-$(git rev-parse --abbrev-ref HEAD)}

echo "🚀 Pushing to GitHub (branch: $BRANCH)..."

git push origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Push failed. Check your connection and permissions."
    exit 1
fi

