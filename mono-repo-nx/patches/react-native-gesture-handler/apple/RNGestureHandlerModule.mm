// Persisted patch: RNGestureHandlerModule.mm
#import "RNGestureHandlerModule.h"

#import <React/RCTComponent.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTViewManager.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/RCTTurboModule.h>

#import <react/renderer/components/text/ParagraphShadowNode.h>
#import <react/renderer/components/text/TextShadowNode.h>
#import <react/renderer/uimanager/primitives.h>
#endif // RCT_NEW_ARCH_ENABLED

#import "RNGestureHandler.h"
#import "RNGestureHandlerDirection.h"
#import "RNGestureHandlerManager.h"
#import "RNGestureHandlerState.h"

#import "RNGestureHandlerButton.h"
#import "RNGestureHandlerStateManager.h"

#import <React/RCTJSThread.h>

#ifdef RCT_NEW_ARCH_ENABLED
using namespace facebook;
using namespace react;
#endif // RCT_NEW_ARCH_ENABLED

#ifdef RCT_NEW_ARCH_ENABLED
@interface RNGestureHandlerModule () <RNGestureHandlerStateManager, RCTTurboModule>

@end
#else
@interface RNGestureHandlerModule () <RCTUIManagerObserver, RNGestureHandlerStateManager>

@end
#endif // RCT_NEW_ARCH_ENABLED

typedef void (^GestureHandlerOperation)(RNGestureHandlerManager *manager);

@implementation RNGestureHandlerModule {
  RNGestureHandlerManager *_manager;

  // Oparations called after views have been updated.
  NSMutableArray<GestureHandlerOperation> *_operations;
}

#ifdef RCT_NEW_ARCH_ENABLED
@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;
@synthesize dispatchToJSThread = _dispatchToJSThread;
#endif // RCT_NEW_ARCH_ENABLED

RCT_EXPORT_MODULE()

// ... (file continues identical to original, but with the ShadowNode bridging change)

#ifdef RCT_NEW_ARCH_ENABLED
void decorateRuntime(jsi::Runtime &runtime)
{
  auto isViewFlatteningDisabled = jsi::Function::createFromHostFunction(
      runtime,
      jsi::PropNameID::forAscii(runtime, "isViewFlatteningDisabled"),
      1,
      [](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *arguments, size_t count) -> jsi::Value {
        if (!arguments[0].isObject()) {
          return jsi::Value::null();
        }

        // Use Bridging conversion to obtain a shared_ptr<const ShadowNode> in a way
        // that is compatible across multiple react native header versions.
        auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(runtime, arguments[0]);

        if (dynamic_pointer_cast<const ParagraphShadowNode>(shadowNode)) {
          return jsi::Value(true);
        }

        if (dynamic_pointer_cast<const TextShadowNode>(shadowNode)) {
          return jsi::Value(true);
        }

        bool isViewFlatteningDisabled = shadowNode->getTraits().check(ShadowNodeTraits::FormsStackingContext);

        return jsi::Value(isViewFlatteningDisabled);
      });
  runtime.global().setProperty(runtime, "isViewFlatteningDisabled", std::move(isViewFlatteningDisabled));
}
#endif // RCT_NEW_ARCH_ENABLED

// The remainder of the file is unchanged from upstream and intentionally left as-is.
