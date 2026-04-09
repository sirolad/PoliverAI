#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const headerPath = path.resolve(
  __dirname,
  '../../../node_modules/react-native/ReactCommon/jsitooling/react/runtime/JSRuntimeFactory.h'
);
const cppPath = path.resolve(
  __dirname,
  '../../../node_modules/react-native/ReactCommon/jsitooling/react/runtime/JSRuntimeFactory.cpp'
);

function patchFile(filePath, original, replacement, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-react-native-jsruntime-factory] ${label} not found, skipping.`);
    return;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  if (source.includes(replacement)) {
    console.log(`[patch-react-native-jsruntime-factory] ${label} already patched.`);
    return;
  }

  if (!source.includes(original)) {
    console.error(
      `[patch-react-native-jsruntime-factory] Expected block missing in ${label}.`
    );
    process.exit(1);
  }

  fs.writeFileSync(filePath, source.replace(original, replacement));
  console.log(`[patch-react-native-jsruntime-factory] Patched ${label}.`);
}

function assertPatched(filePath, snippets, label) {
  const source = fs.readFileSync(filePath, 'utf8');
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  if (missing.length === 0) {
    console.log(`[patch-react-native-jsruntime-factory] ${label} already patched.`);
    return true;
  }
  return false;
}

function assertCompatible(filePath, snippets, label) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  if (missing.length === 0) {
    console.log(
      `[patch-react-native-jsruntime-factory] ${label} already compatible; skipping.`
    );
    return true;
  }
  return false;
}

if (
  assertCompatible(
    headerPath,
    [
      'class JSRuntime {',
      'virtual jsinspector_modern::RuntimeTargetDelegate& getRuntimeTargetDelegate();',
      'std::optional<jsinspector_modern::FallbackRuntimeTargetDelegate>',
      'class JSIRuntimeHolder : public JSRuntime {',
      'explicit JSIRuntimeHolder(std::unique_ptr<jsi::Runtime> runtime);',
    ],
    'JSRuntimeFactory.h'
  ) &&
  assertCompatible(
    cppPath,
    [
      'jsi::Runtime& JSIRuntimeHolder::getRuntime() noexcept {',
      'jsinspector_modern::RuntimeTargetDelegate&',
      'JSRuntime::getRuntimeTargetDelegate() {',
      'runtimeTargetDelegate_.emplace(getRuntime().description());',
    ],
    'JSRuntimeFactory.cpp'
  )
) {
  process.exit(0);
}

if (
  fs.existsSync(headerPath) &&
  fs.existsSync(cppPath) &&
  assertPatched(
    headerPath,
    [
      'virtual jsinspector_modern::RuntimeTargetDelegate& getRuntimeTargetDelegate();',
      'jsinspector_modern::tracing::RuntimeSamplingProfile collectSamplingProfile()',
      'class JSIRuntimeHolder : public JSRuntime {\n public:\n  jsi::Runtime& getRuntime() noexcept override;\n\n  explicit JSIRuntimeHolder',
    ],
    'JSRuntimeFactory.h'
  ) &&
  assertPatched(
    cppPath,
    [
      'jsinspector_modern::RuntimeTargetDelegate& JSRuntime::getRuntimeTargetDelegate()',
      'JSRuntime::collectSamplingProfile()',
    ],
    'JSRuntimeFactory.cpp'
  )
) {
  process.exit(0);
}

patchFile(
  headerPath,
  `  // virtual jsinspector_modern::RuntimeTargetDelegate& getRuntimeTargetDelegate();

  /**
   * Run initialize work that must happen on the runtime's JS thread. Used for
   * initializing TLS and registering profiling.
   *
   * TODO T194671568 Move the runtime constructor to the JsThread
   */
  virtual void unstable_initializeOnJsThread() {}

 private:
`,
  `  virtual jsinspector_modern::RuntimeTargetDelegate& getRuntimeTargetDelegate();

  /**
   * Run initialize work that must happen on the runtime's JS thread. Used for
   * initializing TLS and registering profiling.
   *
   * TODO T194671568 Move the runtime constructor to the JsThread
   */
  virtual void unstable_initializeOnJsThread() {}

  std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate> createAgentDelegate(
      jsinspector_modern::FrontendChannel channel,
      jsinspector_modern::SessionState& sessionState,
      std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const jsinspector_modern::ExecutionContextDescription&
          executionContextDescription,
      RuntimeExecutor runtimeExecutor) override;

  void addConsoleMessage(
      jsi::Runtime& runtime,
      jsinspector_modern::ConsoleMessage message) override;

  bool supportsConsole() const override;

  std::unique_ptr<jsinspector_modern::StackTrace> captureStackTrace(
      jsi::Runtime& runtime,
      size_t framesToSkip = 0) override;

  void enableSamplingProfiler() override;

  void disableSamplingProfiler() override;

  jsinspector_modern::tracing::RuntimeSamplingProfile collectSamplingProfile()
      override;

 private:
`,
  'JSRuntimeFactory.h base delegate block'
);

patchFile(
  headerPath,
  `class JSIRuntimeHolder : public JSRuntime {
 public:
  jsi::Runtime& getRuntime() noexcept override;
  void addConsoleMessage(jsi::Runtime& runtime, jsinspector_modern::ConsoleMessage message) override;
  bool supportsConsole() const override;

  std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate> createAgentDelegate(
      jsinspector_modern::FrontendChannel frontendChannel,
      jsinspector_modern::SessionState& sessionState,
      std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const jsinspector_modern::ExecutionContextDescription&
          executionContextDescription,
      RuntimeExecutor runtimeExecutor) override;

  explicit JSIRuntimeHolder(std::unique_ptr<jsi::Runtime> runtime);
`,
  `class JSIRuntimeHolder : public JSRuntime {
 public:
  jsi::Runtime& getRuntime() noexcept override;

  explicit JSIRuntimeHolder(std::unique_ptr<jsi::Runtime> runtime);
`,
  'JSRuntimeFactory.h runtime holder block'
);

patchFile(
  cppPath,
  `#include "JSRuntimeFactory.h"
#include <jsinspector-modern/ConsoleMessage.h>
#include <jsinspector-modern/FallbackRuntimeAgentDelegate.h>

namespace facebook::react {

jsi::Runtime& JSIRuntimeHolder::getRuntime() noexcept {
  return *runtime_;
}

JSIRuntimeHolder::JSIRuntimeHolder(std::unique_ptr<jsi::Runtime> runtime)
    : runtime_(std::move(runtime)) {
  assert(runtime_ != nullptr);
}

void JSIRuntimeHolder::addConsoleMessage(jsi::Runtime& runtime, jsinspector_modern::ConsoleMessage message) {
  return;
}

bool JSIRuntimeHolder::supportsConsole() const{
  return false;
}

std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate>
JSIRuntimeHolder::createAgentDelegate(
    jsinspector_modern::FrontendChannel frontendChannel,
    jsinspector_modern::SessionState& sessionState,
    std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate::ExportedState>,
    const jsinspector_modern::ExecutionContextDescription&
        executionContextDescription,
    RuntimeExecutor runtimeExecutor) {
  (void)executionContextDescription;
  (void)runtimeExecutor;
  return std::make_unique<jsinspector_modern::FallbackRuntimeAgentDelegate>(
      std::move(frontendChannel), sessionState, runtime_->description());
}

} // namespace facebook::react
`,
  `#include "JSRuntimeFactory.h"
#include <jsinspector-modern/ConsoleMessage.h>
#include <jsinspector-modern/FallbackRuntimeTargetDelegate.h>
#include <jsinspector-modern/FallbackRuntimeAgentDelegate.h>

namespace facebook::react {

jsinspector_modern::RuntimeTargetDelegate& JSRuntime::getRuntimeTargetDelegate() {
  if (!runtimeTargetDelegate_) {
    runtimeTargetDelegate_.emplace(getRuntime().description());
  }
  return *runtimeTargetDelegate_;
}

std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate>
JSRuntime::createAgentDelegate(
    jsinspector_modern::FrontendChannel channel,
    jsinspector_modern::SessionState& sessionState,
    std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate::ExportedState>
        previouslyExportedState,
    const jsinspector_modern::ExecutionContextDescription&
        executionContextDescription,
    RuntimeExecutor runtimeExecutor) {
  return getRuntimeTargetDelegate().createAgentDelegate(
      std::move(channel),
      sessionState,
      std::move(previouslyExportedState),
      executionContextDescription,
      runtimeExecutor);
}

void JSRuntime::addConsoleMessage(
    jsi::Runtime& runtime,
    jsinspector_modern::ConsoleMessage message) {
  getRuntimeTargetDelegate().addConsoleMessage(runtime, std::move(message));
}

bool JSRuntime::supportsConsole() const {
  return const_cast<JSRuntime*>(this)->getRuntimeTargetDelegate().supportsConsole();
}

std::unique_ptr<jsinspector_modern::StackTrace> JSRuntime::captureStackTrace(
    jsi::Runtime& runtime,
    size_t framesToSkip) {
  return getRuntimeTargetDelegate().captureStackTrace(runtime, framesToSkip);
}

void JSRuntime::enableSamplingProfiler() {
  getRuntimeTargetDelegate().enableSamplingProfiler();
}

void JSRuntime::disableSamplingProfiler() {
  getRuntimeTargetDelegate().disableSamplingProfiler();
}

jsinspector_modern::tracing::RuntimeSamplingProfile
JSRuntime::collectSamplingProfile() {
  return getRuntimeTargetDelegate().collectSamplingProfile();
}

jsi::Runtime& JSIRuntimeHolder::getRuntime() noexcept {
  return *runtime_;
}

JSIRuntimeHolder::JSIRuntimeHolder(std::unique_ptr<jsi::Runtime> runtime)
    : runtime_(std::move(runtime)) {
  assert(runtime_ != nullptr);
}

} // namespace facebook::react
`,
  'JSRuntimeFactory.cpp'
);
