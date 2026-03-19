#!/usr/bin/env bash
# Creates deterministic symlink locations used by generated podspecs/scripts
# to locate react-native packages when generated paths become overly long.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_MACOS_DIR="$REPO_ROOT/apps/poliverai/macos"
FALLBACK_ROOT="$APP_MACOS_DIR/node_modules"
WORKSPACE_RN_DIR="$REPO_ROOT/node_modules/react-native"

link_package() {
  local package_name="$1"
  local target_path="$REPO_ROOT/node_modules/$package_name"
  local link_path="$FALLBACK_ROOT/$package_name"

  if [ ! -d "$target_path" ]; then
    echo "Warning: $target_path does not exist. No symlink created for $package_name." >&2
    return
  fi

  mkdir -p "$FALLBACK_ROOT"

  if [ -L "$link_path" ]; then
    local current_target
    current_target="$(readlink "$link_path")"
    if [ "$current_target" = "$target_path" ]; then
      echo "Fallback path already exists: $link_path"
      return
    fi
    rm "$link_path"
  elif [ -e "$link_path" ]; then
    echo "Warning: $link_path exists and is not a symlink. Skipping $package_name." >&2
    return
  fi

  ln -s "$target_path" "$link_path"
  echo "Created symlink: $link_path -> $target_path"
}

link_package "react-native-macos"
link_package "react-native"

rewrite_codegen_path() {
  local file_path="$1"

  if [ ! -f "$file_path" ]; then
    return
  fi

  perl -0pi -e 's#\$RCT_SCRIPT_POD_INSTALLATION_ROOT/[^"\n]*node_modules/react-native#'"$WORKSPACE_RN_DIR"'#g' "$file_path"
  echo "Rewrote React codegen path in: $file_path"
}

rewrite_codegen_path "$APP_MACOS_DIR/build/generated/ios/ReactCodegen.podspec"
rewrite_codegen_path "$APP_MACOS_DIR/Pods/Local Podspecs/ReactCodegen.podspec.json"
rewrite_codegen_path "$APP_MACOS_DIR/Pods/Pods.xcodeproj/project.pbxproj"
