#import "AppDelegate.h"
#import "MacSplashScreen.h"

#import <React/RCTBundleURLProvider.h>
#if DEBUG
#import <React/RCTDevLoadingView.h>
#endif

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"PoliverAI";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  [super applicationDidFinishLaunching:notification];

#if DEBUG
  [RCTDevLoadingView setEnabled:NO];
#endif

  if (self.window != nil) {
    self.window.backgroundColor = NSColor.whiteColor;
    [self.window makeKeyAndOrderFront:nil];
  }

  [NSApp activateIgnoringOtherApps:YES];
  [MacSplashScreen show];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"src/Main"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
#ifdef RN_FABRIC_ENABLED
  return true;
#else
  return false;
#endif
}

@end
