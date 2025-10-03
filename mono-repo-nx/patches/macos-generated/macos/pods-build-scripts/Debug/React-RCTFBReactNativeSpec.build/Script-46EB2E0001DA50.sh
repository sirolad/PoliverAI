#!/bin/sh
echo "Checking whether Codegen has run..."
fbReactNativeSpecPath="$REACT_NATIVE_PATH/React/FBReactNativeSpec"

if [[ ! -d "$fbReactNativeSpecPath" ]]; then
  echo 'error: Codegen did not run properly in your project. Please reinstall cocoapods with `bundle exec pod install`.'
  exit 1
fi

