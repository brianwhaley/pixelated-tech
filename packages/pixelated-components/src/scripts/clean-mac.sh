#!/bin/bash

# Ensure the script is run with root privileges
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run this script with sudo: sudo ./clean.sh"
  exit 1
fi

# Bulletproof way to get your real Mac username
REAL_USER=$(logname)
USER_HOME="/Users/$REAL_USER"

echo "🧹 Starting Mac developer cleanup script for $REAL_USER..."

# 1. Clean Node Package Manager (NPM) Cache
echo "→ Cleaning NPM..."
sudo -u "$REAL_USER" npm cache clean --force 2>/dev/null
rm -rf "$USER_HOME/.npm"

# 2. Source NVM safely to clean Node Version Manager Caches
echo "→ Cleaning NVM..."
if [ -s "$USER_HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$USER_HOME/.nvm"
    # Load NVM into this script context safely
    sudo -u "$REAL_USER" bash -c "source $NVM_DIR/nvm.sh && nvm cache clear" 2>/dev/null
fi
rm -rf "$USER_HOME/.nvm/.cache"

# 3. Purge Global and System Caches
echo "→ Clearing system and library caches..."
rm -rf "$USER_HOME/.cache"/* 2>/dev/null
rm -rf "$USER_HOME/Library/Caches"/* 2>/dev/null

# 4. Clean Browser Caches (Chrome & Edge)
echo "→ Sweeping browser caches..."
rm -rf "$USER_HOME/Library/Application Support/Google/Chrome/Default/Cache"/* 2>/dev/null
rm -rf "$USER_HOME/Library/Application Support/Google/Chrome/Profile"*/Cache/* 2>/dev/null
rm -rf "$USER_HOME/Library/Application Support/Microsoft Edge/Default/Cache"/* 2>/dev/null
rm -rf "$USER_HOME/Library/Application Support/Microsoft Edge/Profile"*/Cache/* 2>/dev/null

# 5. Clean VS Code Caches & Ghost Workspaces
echo "→ Trimming VS Code workspace history..."
rm -rf "$USER_HOME/Library/Application Support/Code/Cache"/* 2>/dev/null
rm -rf "$USER_HOME/Library/Application Support/Code/CachedData"/* 2>/dev/null
rm -rf "$USER_HOME/Library/Application Support/Code/User/WorkspaceStorage"/* 2>/dev/null

# 6. Clear Cloud Storage Cache
echo "→ Flushing Dropbox scratchpad..."
rm -rf "$USER_HOME/Library/Application Support/Dropbox/cache"/* 2>/dev/null

# 7. Purge Preview App Autosave Data
echo "→ Wiping giant Apple Preview caches..."
rm -rf "$USER_HOME/Library/Containers/com.apple.Preview/Data/Library/Caches"/* 2>/dev/null
rm -rf "$USER_HOME/Library/Containers/com.apple.Preview/Data/Library/Autosave Information"/* 2>/dev/null
rm -rf "$USER_HOME/Library/Containers/com.apple.Preview/Data/Library/Saved Application State"/* 2>/dev/null

echo "✨ Storage cleanup completed successfully!"
