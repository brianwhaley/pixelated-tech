#!/bin/bash

# Setup remotes for pixelated-tech monorepo
# Adds remotes for all apps/tools/packages to enable efficient git subtree operations

set -e

MONOREPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITHUB_USER="brianwhaley"

# All repositories (apps, tools, packages)
REPOS=(
    "pixelated-tech"        # monorepo itself
    "brianwhaley"
    "informationfocus"
    "jz-home-improvement"
    "leadscraper"
    "manningmetalworks"
    "oaktreelandscaping"
    "palmetto-epoxy"
    "pixelated"
    "pixelated-admin"
    "pixelated-components"
    "pixelated-template"
    "pixelvivid"
    "threemuses"
)

echo "Setting up Git remotes for pixelated-tech monorepo..."
echo "====================================================="
echo ""

cd "$MONOREPO_DIR"

# Add remotes named after each repository
for repo in "${REPOS[@]}"; do
    remote_url="https://github.com/$GITHUB_USER/$repo.git"
    
    if git remote | grep -q "^$repo$"; then
        echo "✓ Remote '$repo' already exists"
        # Update URL in case it changed
        git remote set-url "$repo" "$remote_url" 2>/dev/null || true
    else
        echo "➕ Adding remote '$repo'"
        git remote add "$repo" "$remote_url"
    fi
done

echo ""
echo "====================================================="
echo "✅ Remote setup complete!"
echo ""
echo "Monorepo remotes configured. Usage examples:"
echo ""
echo "  # List all remotes"
echo "  git remote -v"
echo ""
echo "  # Fetch updates from an app repo"
echo "  git fetch brianwhaley"
echo ""
echo "  # Push monorepo brianwhaley to its GitHub repo via git subtree"
echo "  git subtree split --prefix apps/brianwhaley -b brianwhaley-split && \\"
echo "    git push -f brianwhaley brianwhaley-split:main && \\"
echo "    git branch -D brianwhaley-split"
echo ""
