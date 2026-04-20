#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PACKAGE_ROOT"

PACKAGE_JSON="$PACKAGE_ROOT/package.json"
if [ ! -f "$PACKAGE_JSON" ]; then
    echo "❌ Error: package.json not found in package root: $PACKAGE_ROOT"
    exit 1
fi

PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_PRIVATE=$(node -p "require('./package.json').private")
REPOSITORY_URL=$(node -p "require('./package.json').repository.url" 2>/dev/null || true)

normalize_git_repo_path() {
    local repo_url="$1"
    repo_url="${repo_url%/}"
    repo_url="${repo_url#git@github.com:}"
    repo_url="${repo_url#ssh://git@github.com/}"
    repo_url="${repo_url#https://github.com/}"
    repo_url="${repo_url#http://github.com/}"
    repo_url="${repo_url#git://github.com/}"
    repo_url="${repo_url%.git}"
    echo "${repo_url%%/}"
}

find_remote_by_repository_url() {
    local repository_url="$1"
    local target_repo
    target_repo=$(normalize_git_repo_path "$repository_url")
    if [ -z "$target_repo" ]; then
        return 1
    fi

    local remote
    for remote in $(git remote); do
        local remote_url
        remote_url=$(git remote get-url "$remote" 2>/dev/null || true)
        if [ -z "$remote_url" ]; then
            continue
        fi

        local remote_repo
        remote_repo=$(normalize_git_repo_path "$remote_url")
        if [ "$remote_repo" = "$target_repo" ]; then
            echo "$remote"
            return 0
        fi
    done

    return 1
}

prompt_version_type() {
    local current_version
    current_version=$(node -p "require('./package.json').version")
    printf "Current version: %s\n" "$current_version" >&2
    printf "Select version bump type:\n" >&2
    printf "1) patch (x.x.1)\n" >&2
    printf "2) minor (x.1.0)\n" >&2
    printf "3) major (1.x.x)\n" >&2
    printf "4) none (use current version)\n" >&2

    local choice
    while true; do
        printf "Enter choice (1-4): " >&2
        if ! read -r choice; then
            printf "\n❌ No choice entered. Aborting.\n" >&2
            exit 1
        fi
        case "$choice" in
            1) printf 'patch\n'; return 0 ;; 
            2) printf 'minor\n'; return 0 ;; 
            3) printf 'major\n'; return 0 ;; 
            4) printf 'none\n'; return 0 ;; 
            *) printf 'Invalid choice. Please choose 1, 2, 3, or 4.\n' >&2 ;; 
        esac
    done
}

check_branch() {
    local current_branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "dev" ]; then
        echo "❌ Error: Must be on dev branch to run publish script"
        echo "Current branch: $current_branch"
        echo "Please switch to dev branch: git checkout dev"
        exit 1
    fi
}

ensure_clean_worktree() {
    local status
    status=$(git status --porcelain)
    if [ -n "$status" ]; then
        echo "❌ Error: your working tree is not clean. Commit, stash, or discard changes before publishing."
        echo "$status"
        exit 1
    fi
    echo "✅ Working tree is clean"
}

ensure_npm_authenticated() {
    if ! npm --no-workspaces whoami >/dev/null 2>&1; then
        echo "❌ Error: npm is not authenticated. Run 'npm login' and try again."
        exit 1
    fi
    local npm_user
    npm_user=$(npm --no-workspaces whoami 2>/dev/null)
    echo "✅ npm authenticated as $npm_user"
}

if [ -z "$REPOSITORY_URL" ]; then
    echo "❌ Error: repository.url is missing from package.json"
    exit 1
fi

if [ "$PACKAGE_PRIVATE" != "false" ]; then
    echo "❌ Error: package is private; publish script only supports public packages"
    exit 1
fi

MONOREPO_ROOT=$(git rev-parse --show-toplevel)
PACKAGE_PATH="${PACKAGE_ROOT#$MONOREPO_ROOT/}"

if [ -z "$(git rev-parse --is-inside-work-tree 2>/dev/null)" ]; then
    echo "❌ Error: not inside a git repository"
    exit 1
fi

REMOTE_NAME=$(find_remote_by_repository_url "$REPOSITORY_URL" || true)
if [ -z "$REMOTE_NAME" ]; then
    echo "❌ Error: no git remote found matching repository.url: $REPOSITORY_URL"
    echo "Available remotes:";
    git remote -v
    exit 1
fi

ensure_clean_worktree
ensure_npm_authenticated
check_branch

VERSION_TYPE=$(prompt_version_type)
if [ "$VERSION_TYPE" != "none" ]; then
    npm --no-workspaces version "$VERSION_TYPE" --force --no-git-tag-version
fi
NEW_VERSION=$(node -p "require('./package.json').version")

if git diff --quiet -- package.json package-lock.json 2>/dev/null; then
    echo "ℹ️  No version or lockfile changes to commit"
else
    git add package.json package-lock.json 2>/dev/null || true
    git commit -m "chore(release): publish $PACKAGE_NAME@$NEW_VERSION"
    echo "✅ Committed version bump to $NEW_VERSION"
fi

echo "📦 Publishing $PACKAGE_NAME@$NEW_VERSION to npm..."
npm --no-workspaces publish --access public

echo "✅ npm publish complete"

echo "🚀 Pushing package subtree to $REMOTE_NAME dev and main..."
cd "$MONOREPO_ROOT"
SUBTREE_BRANCH="publish-${PACKAGE_NAME}-${NEW_VERSION}"
git subtree split --prefix="$PACKAGE_PATH" -b "$SUBTREE_BRANCH"
git push --force "$REMOTE_NAME" "$SUBTREE_BRANCH:dev"
git push --force "$REMOTE_NAME" "$SUBTREE_BRANCH:main"
git branch -D "$SUBTREE_BRANCH"

echo "✅ Subtree push complete"

echo "✅ Publish workflow complete for $PACKAGE_NAME@$NEW_VERSION"
