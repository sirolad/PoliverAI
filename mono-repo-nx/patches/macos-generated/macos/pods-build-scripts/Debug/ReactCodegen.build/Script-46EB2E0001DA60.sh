#!/bin/sh
pushd "$PODS_ROOT/../" > /dev/null
RCT_SCRIPT_POD_INSTALLATION_ROOT=$(pwd)
popd >/dev/null

export RCT_SCRIPT_RN_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT/../../../node_modules/react-native-macos"
export RCT_SCRIPT_APP_PATH="$RCT_SCRIPT_POD_INSTALLATION_ROOT/.."
export RCT_SCRIPT_OUTPUT_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT"
export RCT_SCRIPT_TYPE="withCodegenDiscovery"

SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
P1="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"
P2="$RCT_SCRIPT_POD_INSTALLATION_ROOT/../../../node_modules/react-native-macos/scripts/xcode/with-environment.sh"
P3="$RCT_SCRIPT_POD_INSTALLATION_ROOT/../node_modules/react-native/scripts/xcode/with-environment.sh"
if [ -x "$P1" ]; then
  WITH_ENVIRONMENT="$P1"
elif [ -x "$P2" ]; then
  WITH_ENVIRONMENT="$P2"
elif [ -x "$P3" ]; then
  WITH_ENVIRONMENT="$P3"
else
  echo "[Codegen] error: could not find with-environment.sh in expected locations:" >&2
  echo "  $P1" >&2
  echo "  $P2" >&2
  echo "  $P3" >&2
  exit 1
fi

# Skip if codegen disabled by build settings
if [ "$RCT_SKIP_CODEGEN" = "1" ] || [ "$DISABLE_CODEGEN" = "1" ]; then
  echo "[Codegen] Skipping codegen because RCT_SKIP_CODEGEN/DISABLE_CODEGEN=1"
  exit 0
fi

# macOS-specific guard: when RN package is react-native-macos, skip codegen to avoid parser incompatibilities
if echo "$RCT_SCRIPT_RN_DIR" | grep -q "react-native-macos"; then
  echo "[Codegen] Detected react-native-macos; skipping codegen on macOS build"
  exit 0
fi

/bin/sh -c "$WITH_ENVIRONMENT $SCRIPT_PHASES_SCRIPT"

