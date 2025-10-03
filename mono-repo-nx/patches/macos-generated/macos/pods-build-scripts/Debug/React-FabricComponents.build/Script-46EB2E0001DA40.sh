#!/bin/sh
echo "Checking whether Codegen has run..."
rncorePath="$REACT_NATIVE_PATH/ReactCommon/react/renderer/components/rncore"

if [[ ! -d "$rncorePath" ]]; then
  echo 'error: Codegen did not run properly in your project. Please reinstall cocoapods with `bundle exec pod install`.'
  exit 1
fi

