Platform greeting

This small file shows how platform-specific files are resolved by Metro.

- `PlatformGreeting.tsx` - default
- `PlatformGreeting.macos.tsx` - macOS override
- `PlatformGreeting.windows.tsx` - Windows override

To test:

```bash
# from repo root
yarn
cd apps/poliverai
# run web
npx expo start --web
# or run on macOS (after prebuild) - macOS only
# npx expo run:macos
```
