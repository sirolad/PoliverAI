This folder stores a committed snapshot of the macOS `build/generated/ios` artifacts
that are normally produced by React Native codegen during `pod install`.

Why
---
In CI and fresh checkouts the React codegen step may fail (parser issues,
missing host dependencies). To make `pod install` reliable we keep a minimal
snapshot of the generated files used by CocoaPods. The `apps/poliverai/macos/Podfile`
will copy files from this folder into `apps/poliverai/macos/build/generated/ios`
before CocoaPods runs.

How to update
-------------
Run the snapshot script to refresh the committed snapshot:

  node ./scripts/snapshot-macos-generated.js

Commit the updated files in `patches/macos-generated/ios`.

Caveats
-------
- This is a pragmatic workaround. Prefer fixing codegen/parsers long-term.
- Keep the snapshot minimal and only include what CocoaPods needs (podspecs
  and generated headers).
