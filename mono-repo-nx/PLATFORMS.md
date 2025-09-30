This repository is an Expo/React Native monorepo (apps/poliverai) with react-native-web support.

Goal: add macOS and Windows support.

Quick guidance

1) Decide managed (Expo) vs bare workflow
1) Decide workflow
- Bare RN (recommended for native control): Add macOS (react-native-macos) and Windows (react-native-windows) directly and configure Xcode / Visual Studio solution files. Use the React Native CLI to build/run:
  - npx react-native run-ios
  - npx react-native run-android
  - npx react-native run-macos (if using react-native-macos)
  - npx react-native run-windows (if using react-native-windows)
- Expo-managed: still an option, but it relies on Expo tooling (expo prebuild / EAS) to generate native projects. If you're switching to RN CLI, you can remove expo and migrate JS/native code accordingly.

2) Preparation steps (recommended)
  - react-native-macos (for macOS native)
  - react-native-windows (for Windows native)

3) Metro / bundler

4) Expo-managed notes

5) Running locally (macOS)
  yarn
  cd apps/poliverai
  cd ios && pod install
  cd ..
  npx react-native run-ios
  Or open `ios/PoliverAI.xcworkspace` in Xcode and build/run the target.

6) Running locally (Windows)

7) Next recommended actions I can help with

If you'd like, tell me whether you want to: (A) add macOS support, (B) add Windows support, or (C) add both, and whether you'd prefer Expo-managed or bare/native workflow. I'll proceed with the exact steps and make the minimal code changes needed.
