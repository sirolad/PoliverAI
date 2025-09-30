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
# run web (if using a web bundler / Vite)
# start Metro for web/native development
npx react-native start
# run on iOS or Android using React Native CLI
npx react-native run-ios
npx react-native run-android
```
