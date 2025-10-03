macOS platform setup for @poliverai/poliverai

This document collects the exact commands and troubleshooting steps to: (A) fix the CocoaPods `pod install` error caused by `react-native-reanimated`, and (B) create a proper `macos/` native project for this app.

---

1) Fix the `pod install` error (Reanimated worklets missing)

Problem: `pod install` fails with:

  [Reanimated] react-native-worklets package isn't installed. Please install a version between 0.4.0 and 0.4 to use Reanimated 4.1.2.

Why: `react-native-reanimated` expects the `react-native-worklets` JS package (a peer dep) to be present when evaluating its podspec. Installing the missing peer dependency resolves the Podspec validation.

Recommended commands (run from repo root):

```bash
# from repo root
cd mono-repo-nx
# install the missing peer dependency into the app package
yarn workspace @poliverai/poliverai add react-native-worklets@^0.4.0

# make sure workspace install is complete
yarn install

# then install iOS pods
cd apps/poliverai/ios
pod install
```

Notes:
- If the version above fails, try `yarn workspace @poliverai/poliverai add react-native-worklets@0.4.0` (pin 0.4.0 exactly).
- If `pod install` still complains, run `pod repo update` then retry.

Alternative quick workaround (temporary, not recommended):
- Remove `react-native-reanimated` from your `package.json` (or comment it out) then run `yarn install` and `pod install`. Re-add `react-native-reanimated` later when you can satisfy its peers.

---

2) Properly scaffold `macos/` (recommended approach)

If your `macos/` directory is incomplete (only a tiny template `package.json`), generate a correct macOS project with the official init tool and then copy it into your app.

Preferred method (works around workspace toolchain problems):

```bash
# do this outside the monorepo to avoid Yarn workspace / npx workspace conflicts
mkdir -p /tmp/rnm-init && cd /tmp/rnm-init
npx react-native-macos-init

# copy the generated macos folder into your app
cp -R macos /full/path/to/PoliverAI/mono-repo-nx/apps/poliverai/macos

# in the app, install pods if needed
cd /full/path/to/PoliverAI/mono-repo-nx/apps/poliverai/macos
# if there's a Podfile for macOS, run pod install
pod install || true

# open Xcode and share the macOS scheme
open /full/path/to/PoliverAI/mono-repo-nx/apps/poliverai/macos/PoliverAI.xcodeproj
# In Xcode: Product → Scheme → Manage Schemes… → Create or check 'PoliverAI-macOS' and mark it Shared

# then from repo root
cd /full/path/to/PoliverAI/mono-repo-nx/apps/poliverai
npx react-native run-macos
```

If `npx react-native-macos-init` fails due to network or workspace issues, try:
- `yarn dlx react-native-macos-init` (after cleaning Yarn cache with `yarn cache clean`), or
- installing `react-native-macos-init` temporarily in the app ( `yarn workspace @poliverai/poliverai add -D react-native-macos-init` ) and running `npx react-native-macos-init` from the app.

---

3) After scaffold & pods

- Open the macOS project in Xcode and make sure the macOS target exists.
- Share the macOS scheme (Product → Scheme → Manage Schemes → Shared) so `xcodebuild` can see it.
- Run the build from Xcode first to fix any provisioning / signing / scheme issues.
- Once Xcode builds, run `npx react-native run-macos` from the app root.

---

4) Troubleshooting pointers

- If `yarn dlx` errors with stream/premature close, try `yarn cache clean` and retry on a stable network.
- If `pod install` complains about Podspecs, run `pod repo update` and retry.
- If the podspec validation still fails because of JS code reading package.json at install time, ensure `node_modules` is present and matches the app package location: the app's `package.json` should list `react-native-worklets` in dependencies and `yarn install` must have run successfully so node_modules exist.

---

If you'd like, I can:
- Add a `scaffold-macos` Nx target that will attempt `yarn dlx react-native-macos-init` (best-effort), or
- Run the `yarn workspace ... add react-native-worklets@^0.4.0` command for you now, or
- Walk you through the Xcode steps interactively.

Tell me which of those you'd like me to do next.