#pragma once
// Inline stub header for react-native-worklets autolinking. This header is used
// to satisfy includes for <rnworklets.h> when the package's native Android
// sources are disabled. The inline provider returns nullptr so autolinking will
// skip this provider at runtime.

#include <memory>
#include <string>

namespace facebook {
namespace react {
  class TurboModule;

  inline std::shared_ptr<TurboModule> rnworklets_ModuleProvider(const std::string &moduleName, const JavaTurboModule::InitParams &params) {
    (void)moduleName;
    (void)params;
    return std::shared_ptr<TurboModule>(nullptr);
  }

} // namespace react
} // namespace facebook
