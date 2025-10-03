#!/usr/bin/env bash
# Creates a deterministic symlink location used by generated podspecs/scripts
# to locate react-native-macos when generated paths become overly long.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_MACOS_DIR="$REPO_ROOT/apps/poliverai/macos"
TARGET_NODE_MODULES="$REPO_ROOT/node_modules/react-native-macos"

# Create a deterministic local node_modules path inside the macOS app that
# points to the workspace-level react-native-macos. This is robust and avoids
# constructing extremely long relative paths which can be fragile on different
# systems. Many generated scripts will resolve `node_modules/react-native-macos`
# relative to the macOS app dir, so this symlink helps them find the package.
FALLBACK_DIR="$APP_MACOS_DIR/node_modules/react-native-macos"

if [ -d "$TARGET_NODE_MODULES" ]; then
  mkdir -p "$(dirname "$FALLBACK_DIR")"
  if [ ! -e "$FALLBACK_DIR" ]; then
    ln -s "$TARGET_NODE_MODULES" "$FALLBACK_DIR"
    echo "Created symlink: $FALLBACK_DIR -> $TARGET_NODE_MODULES"
  else
    echo "Fallback path already exists: $FALLBACK_DIR"
  fi
else
  echo "Warning: $TARGET_NODE_MODULES does not exist. No symlink created." >&2
fi
