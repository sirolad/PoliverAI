#import "MacDocumentPicker.h"

#import <AppKit/AppKit.h>
#import <React/RCTBridgeModule.h>

static NSString *MacDocumentPickerMimeTypeForExtension(NSString *extension)
{
  NSDictionary<NSString *, NSString *> *mimeMap = @{
    @"pdf": @"application/pdf",
    @"docx": @"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    @"html": @"text/html",
    @"xhtml": @"application/xhtml+xml",
    @"txt": @"text/plain",
  };

  NSString *normalized = extension.lowercaseString;
  NSString *mimeType = mimeMap[normalized];
  return mimeType ?: @"application/octet-stream";
}

@interface MacDocumentPicker () <RCTBridgeModule>
@end

@implementation MacDocumentPicker

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_REMAP_METHOD(pickDocument,
                 pickDocumentWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSOpenPanel *panel = [NSOpenPanel openPanel];
    panel.canChooseFiles = YES;
    panel.canChooseDirectories = NO;
    panel.allowsMultipleSelection = NO;
    panel.resolvesAliases = YES;
    panel.canCreateDirectories = NO;

    NSArray<NSString *> *allowedExtensions = [options[@"allowedExtensions"] isKindOfClass:[NSArray class]]
      ? options[@"allowedExtensions"]
      : @[];
    if (allowedExtensions.count > 0) {
      panel.allowedFileTypes = allowedExtensions;
    }

    NSModalResponse response = [panel runModal];
    if (response != NSModalResponseOK || panel.URLs.count == 0) {
      reject(@"E_PICKER_CANCELLED", @"User cancelled document picker", nil);
      return;
    }

    NSURL *sourceURL = panel.URLs.firstObject;
    if (sourceURL == nil) {
      reject(@"E_PICKER_NO_FILE", @"No file was selected", nil);
      return;
    }

    NSString *filename = sourceURL.lastPathComponent ?: @"document";
    NSString *extension = sourceURL.pathExtension ?: @"";
    NSString *tempDirectory = NSTemporaryDirectory();
    NSString *uniqueName = [NSString stringWithFormat:@"%@-%@%@", NSUUID.UUID.UUIDString, sourceURL.URLByDeletingPathExtension.lastPathComponent ?: @"document", extension.length > 0 ? [@"." stringByAppendingString:extension] : @""];
    NSString *destinationPath = [tempDirectory stringByAppendingPathComponent:uniqueName];
    NSURL *destinationURL = [NSURL fileURLWithPath:destinationPath];

    NSError *copyError = nil;
    [[NSFileManager defaultManager] removeItemAtURL:destinationURL error:nil];
    BOOL copied = [[NSFileManager defaultManager] copyItemAtURL:sourceURL toURL:destinationURL error:&copyError];
    if (!copied) {
      reject(@"E_PICKER_COPY_FAILED", copyError.localizedDescription ?: @"Failed to copy selected file", copyError);
      return;
    }

    NSNumber *fileSize = nil;
    NSDictionary<NSFileAttributeKey, id> *attributes =
      [[NSFileManager defaultManager] attributesOfItemAtPath:destinationPath error:nil];
    if ([attributes[NSFileSize] isKindOfClass:[NSNumber class]]) {
      fileSize = attributes[NSFileSize];
    }

    resolve(@{
      @"uri": destinationURL.absoluteString ?: @"",
      @"name": filename,
      @"type": MacDocumentPickerMimeTypeForExtension(extension),
      @"size": fileSize ?: [NSNull null],
    });
  });
}

@end
