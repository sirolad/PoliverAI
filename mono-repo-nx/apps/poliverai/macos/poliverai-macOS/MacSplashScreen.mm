#import "MacSplashScreen.h"

#import <AppKit/AppKit.h>
#import <React/RCTBridgeModule.h>

static NSWindow *splashWindow = nil;

@interface MacSplashScreen () <RCTBridgeModule>
@end

@implementation MacSplashScreen

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

+ (void)show
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (splashWindow != nil) {
      [splashWindow orderFrontRegardless];
      return;
    }

    NSScreen *screen = NSApp.mainWindow.screen ?: NSScreen.mainScreen;
    if (screen == nil) {
      return;
    }

    NSRect visibleFrame = screen.visibleFrame;
    CGFloat windowWidth = MIN(640.0, NSWidth(visibleFrame) * 0.72);
    CGFloat windowHeight = MIN(360.0, NSHeight(visibleFrame) * 0.58);
    NSRect frame = NSMakeRect(NSMidX(visibleFrame) - windowWidth / 2.0,
                              NSMidY(visibleFrame) - windowHeight / 2.0,
                              windowWidth,
                              windowHeight);

    NSWindow *window = [[NSWindow alloc] initWithContentRect:frame
                                                   styleMask:NSWindowStyleMaskBorderless
                                                     backing:NSBackingStoreBuffered
                                                       defer:NO];

    window.backgroundColor = NSColor.whiteColor;
    window.opaque = YES;
    window.hasShadow = NO;
    window.level = NSModalPanelWindowLevel;
    window.releasedWhenClosed = NO;
    window.ignoresMouseEvents = YES;
    window.collectionBehavior = NSWindowCollectionBehaviorTransient | NSWindowCollectionBehaviorMoveToActiveSpace;

    NSView *contentView = [[NSView alloc] initWithFrame:frame];
    contentView.wantsLayer = YES;
    contentView.layer.backgroundColor = NSColor.whiteColor.CGColor;

    NSImage *logo = [NSImage imageNamed:@"BootSplashLogo"];
    if (logo != nil) {
      CGFloat logoWidth = 300.0;
      CGFloat logoHeight = 150.0;
      NSImageView *imageView = [[NSImageView alloc] initWithFrame:NSMakeRect((NSWidth(frame) - logoWidth) / 2.0,
                                                                             (NSHeight(frame) - logoHeight) / 2.0,
                                                                             logoWidth,
                                                                             logoHeight)];
      imageView.image = logo;
      imageView.imageScaling = NSImageScaleProportionallyUpOrDown;
      imageView.imageAlignment = NSImageAlignCenter;
      [contentView addSubview:imageView];
    }

    window.contentView = contentView;
    [window center];
    [window orderFrontRegardless];

    splashWindow = window;
  });
}

+ (void)hide
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (splashWindow == nil) {
      return;
    }

    NSWindow *window = splashWindow;
    splashWindow = nil;

    [NSAnimationContext runAnimationGroup:^(NSAnimationContext *context) {
      context.duration = 0.18;
      window.animator.alphaValue = 0.0;
    } completionHandler:^{
      [window orderOut:nil];
      [window close];
    }];
  });
}

RCT_EXPORT_METHOD(hide)
{
  [[self class] hide];
}

@end
