This repository is an Expo/React Native monorepo (apps/poliverai) with react-native-web support.

Goal: add macOS and Windows support.

Quick guidance

1) Decide managed (Expo) vs bare workflow
- Expo-managed: Expo supports macOS & Windows via EAS and "expo run:macos" / "expo run:windows" only when using the "expo prebuild" / bare native projects for those platforms. Full first-class support varies by Expo SDK version. For macOS you may use react-native-macos; for Windows you may use react-native-windows.
- Bare RN: you can add macOS (react-native-macos) and Windows (react-native-windows) directly and configure Xcode / Visual Studio solution files.

2) Preparation steps (recommended)
- Commit any local changes.
- Install optional platform packages (only if you intend to build native):
  - react-native-macos (for macOS native)
  - react-native-windows (for Windows native)

3) Metro / bundler
- We added macos/windows to the app's Metro config in `apps/poliverai/metro.config.js`.
- If you keep libs in the workspace, add watchFolders to Metro if you get module resolution errors.

4) Expo-managed notes
- If you're staying in Expo Managed, you'll typically run `expo prebuild` to generate native projects and then add macOS/Windows via the appropriate tooling.
- You may prefer to switch to the Bare workflow if you need deep native changes.

5) Running locally (macOS)
- prerequisites: Xcode, CocoaPods, Node, Yarn
- from repo root:
  yarn
  cd apps/poliverai
  expo prebuild --platform ios (or macos if using expo-run plugins)
  open ios/PoliverAI.xcworkspace
  Build in Xcode for the macOS target (if added) or run via `expo run:macos` if available.

6) Running locally (Windows)
- prerequisites: Visual Studio (with C++ workload), Windows 10/11, Node, Yarn
- Install `react-native-windows` and follow their docs to generate solution files.
- Build from Visual Studio or use `npx react-native run-windows`.

7) Next recommended actions I can help with
- Add the necessary `react-native-macos` and `react-native-windows` boilerplate files.
- Run `yarn add react-native-macos react-native-windows` and fix any dependency conflicts.
- Create example platform-specific components (e.g., `.macos.tsx` / `.windows.tsx`) and add documentation.

If you'd like, tell me whether you want to: (A) add macOS support, (B) add Windows support, or (C) add both, and whether you'd prefer Expo-managed or bare/native workflow. I'll proceed with the exact steps and make the minimal code changes needed.
