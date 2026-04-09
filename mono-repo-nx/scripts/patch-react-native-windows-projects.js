const fs = require('fs');
const path = require('path');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeIfChanged(filePath, next) {
  const current = fs.existsSync(filePath) ? read(filePath) : null;
  if (current === next) return false;
  fs.writeFileSync(filePath, next, 'utf8');
  return true;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SOLUTION_NATIVE_PACKAGES = [
  'react-native-windows',
  '@react-native-async-storage\\async-storage',
  'react-native-document-picker',
  'react-native-screens',
  'react-native-svg',
];

function normalizeWindowsProjectPaths({ repoRoot, appRoot, logPrefix }) {
  const windowsRoot = path.join(appRoot, 'windows');
  const slnPath = path.join(windowsRoot, 'poliverai.sln');
  const vcxprojPath = path.join(windowsRoot, 'poliverai', 'poliverai.vcxproj');
  if (!fs.existsSync(slnPath) || !fs.existsSync(vcxprojPath)) return;

  const rootNodeModulesRelativeFromWindows = path.relative(windowsRoot, path.join(repoRoot, 'node_modules')).replace(/\//g, '\\\\');
  const rootNodeModulesRelativeFromProject = path.relative(path.join(windowsRoot, 'poliverai'), path.join(repoRoot, 'node_modules')).replace(/\//g, '\\\\');

  let sln = read(slnPath);
  const uncRepoRoot = repoRoot.replace(/\//g, '\\\\');
  for (const packageName of SOLUTION_NATIVE_PACKAGES) {
    const canonicalPackagePath = `${rootNodeModulesRelativeFromWindows}\\${packageName}`;
    const packagePattern = new RegExp(`(?:\\.\\.\\\\)+node_modules\\\\${escapeRegExp(packageName)}`, 'gi');
    sln = sln.replace(packagePattern, canonicalPackagePath);
    sln = sln.replaceAll(`\\\\psf\\\\Home\\\\PoliverAI\\\\mono-repo-nx\\\\node_modules\\\\${packageName}`, canonicalPackagePath);
    sln = sln.replaceAll(`${uncRepoRoot}\\node_modules\\${packageName}`, canonicalPackagePath);
  }
  if (writeIfChanged(slnPath, sln)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, slnPath)}`);

  let vcxproj = read(vcxprojPath);
  vcxproj = vcxproj.replace(/<ReactNativeWindowsDir Condition="'\$\(ReactNativeWindowsDir\)' == ''">[\s\S]*?<\/ReactNativeWindowsDir>/, `<ReactNativeWindowsDir Condition="'$(ReactNativeWindowsDir)' == ''">$(SolutionDir)${rootNodeModulesRelativeFromWindows}\\react-native-windows\\</ReactNativeWindowsDir>`);

  if (writeIfChanged(vcxprojPath, vcxproj)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, vcxprojPath)}`);
}

function normalizeReactNativeWindowsBuildSettings({ repoRoot, logPrefix }) {
  const rnwProjectPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Microsoft.ReactNative', 'Microsoft.ReactNative.vcxproj');
  if (!fs.existsSync(rnwProjectPath)) return;

  let project = read(rnwProjectPath);
  project = project.replace(/\s*<Target Name="InjectForcedXamlIncludes" BeforeTargets="CompileXamlGeneratedFiles">[\s\S]*?<\/Target>/g, '\n');
  const forcedXamlIncludesTarget = [
    '  <Target Name="InjectForcedXamlIncludes" BeforeTargets="CompileXamlGeneratedFiles">',
    '    <ItemGroup>',
    "      <ClCompile Condition=\"'%(ClCompile.CompilerIteration)' == 'XamlGenerated'\">",
    '        <ForcedIncludeFiles>%(ForcedIncludeFiles);unknwn.h;winrt/Microsoft.UI.Xaml.Controls.h;winrt/Microsoft.UI.Xaml.XamlTypeInfo.h</ForcedIncludeFiles>',
    '      </ClCompile>',
    '    </ItemGroup>',
    '  </Target>'
  ].join('\r\n');
  if (!project.includes('unknwn.h;winrt/Microsoft.UI.Xaml.Controls.h;winrt/Microsoft.UI.Xaml.XamlTypeInfo.h')) {
    project = project.replace(/<\/Project>\s*$/, `${forcedXamlIncludesTarget}\r\n</Project>\r\n`);
  }

  project = project.replace('<PrecompiledHeader>Use</PrecompiledHeader>', '<PrecompiledHeader>NotUsing</PrecompiledHeader>');
  project = project.replace(/\s*<PrecompiledHeaderFile>pch\.h<\/PrecompiledHeaderFile>\r?\n/g, '\n');
  project = project.replace(/\s*<PrecompiledHeaderOutputFile>\$\(IntDir\)pch\.pch<\/PrecompiledHeaderOutputFile>\r?\n/g, '\n');
  project = project.replace(/\s*<ForcedIncludeFiles>pch\.h<\/ForcedIncludeFiles>\r?\n/g, '\n');
  project = project.replace(/\s*<MultiProcessorCompilation>false<\/MultiProcessorCompilation>\r?\n/g, '\n');
  project = project.replace(/\s*<MinimalRebuild>false<\/MinimalRebuild>\r?\n/g, '\n');
  project = project.replace(/<ClCompile Include="Pch\\pch\.cpp">\r?\n\s*<PrecompiledHeader>Create<\/PrecompiledHeader>\r?\n\s*<\/ClCompile>/g, '<ClCompile Include="Pch\\pch.cpp">\n      <ExcludedFromBuild>true</ExcludedFromBuild>\n    </ClCompile>');
  if (writeIfChanged(rnwProjectPath, project)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, rnwProjectPath)}`);

  const platformConstantsPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Shared', 'Modules', 'PlatformConstantsModule.cpp');
  if (fs.existsSync(platformConstantsPath)) {
    let platformConstants = read(platformConstantsPath);
    platformConstants = platformConstants.replace(
      /\/\*static\*\/ int32_t PlatformConstantsModule::OsVersion\(\) noexcept \{[\s\S]*?\n\}/,
      `/*static*/ int32_t PlatformConstantsModule::OsVersion() noexcept {\n  if (!ApiInformation::IsApiContractPresent(L"Windows.Foundation.UniversalApiContract", 1)) {\n    return -1;\n  }\n\n  for (uint16_t i = 2;; ++i) {\n    if (!ApiInformation::IsApiContractPresent(L"Windows.Foundation.UniversalApiContract", i)) {\n      return i - 1;\n    }\n  }\n}`
    );
    if (writeIfChanged(platformConstantsPath, platformConstants)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, platformConstantsPath)}`);
  }

  const lessExceptionsPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Shared', 'Utils', 'CppWinrtLessExceptions.h');
  if (fs.existsSync(lessExceptionsPath)) {
    let lessExceptions = read(lessExceptionsPath);
    if (!lessExceptions.includes('#include <winerror.h>')) {
      lessExceptions = lessExceptions.replace('#include <winrt/base.h>\r\n', '#include <winrt/base.h>\r\n#include <winerror.h>\r\n');
    }
    if (writeIfChanged(lessExceptionsPath, lessExceptions)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, lessExceptionsPath)}`);
  }

  const redirectFilterPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Shared', 'Networking', 'RedirectHttpFilter.cpp');
  if (fs.existsSync(redirectFilterPath)) {
    let redirectFilter = read(redirectFilterPath);
    if (!redirectFilter.includes('#include <winerror.h>')) {
      redirectFilter = redirectFilter.replace(/#include <winapifamily\.h>\r?\n/, '$&#include <winerror.h>\r\n');
    }
    if (writeIfChanged(redirectFilterPath, redirectFilter)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, redirectFilterPath)}`);
  }

  const winrtHttpResourcePath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Shared', 'Networking', 'WinRTHttpResource.cpp');
  if (fs.existsSync(winrtHttpResourcePath)) {
    let winrtHttpResource = read(winrtHttpResourcePath);
    if (!winrtHttpResource.includes('#include <winerror.h>')) {
      winrtHttpResource = winrtHttpResource.replace('// Windows API\r\n', '// Windows API\r\n#include <winerror.h>\r\n');
    }
    if (writeIfChanged(winrtHttpResourcePath, winrtHttpResource)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, winrtHttpResourcePath)}`);
  }

  const originPolicyPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Shared', 'Networking', 'OriginPolicyHttpFilter.cpp');
  if (fs.existsSync(originPolicyPath)) {
    let originPolicy = read(originPolicyPath);
    if (!originPolicy.includes('#include <winerror.h>')) {
      originPolicy = originPolicy.replace(/\/\/ Boost Library\r?\n/, '#include <winerror.h>\r\n#include <urlmon.h>\r\n#include <WinInet.h>\r\n\r\n// Boost Library\r\n');
    } else if (!originPolicy.includes('#include <WinInet.h>')) {
      if (originPolicy.includes('#include <urlmon.h>\r\n')) {
        originPolicy = originPolicy.replace('#include <urlmon.h>\r\n', '#include <urlmon.h>\r\n#include <WinInet.h>\r\n');
      } else {
        originPolicy = originPolicy.replace(/\/\/ Boost Library\r?\n/, '#include <WinInet.h>\r\n\r\n// Boost Library\r\n');
      }
    }
    originPolicy = originPolicy.replace('throw hresult_error{INET_E_REDIRECTING, L"Redirect is not allowed in a preflight request"};', 'throw hresult_error{E_INVALIDARG, L"Redirect is not allowed in a preflight request"};');
    if (writeIfChanged(originPolicyPath, originPolicy)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, originPolicyPath)}`);
  }
}

function normalizeDocumentPickerWindowsSupport({ repoRoot, logPrefix }) {
  const packageRoot = path.join(repoRoot, 'node_modules', 'react-native-document-picker', 'windows');
  const csprojPath = path.join(packageRoot, 'ReactNativeDocumentPicker', 'ReactNativeDocumentPicker.csproj');
  const nugetConfigPath = path.join(packageRoot, 'NuGet.Config');
  if (!fs.existsSync(csprojPath)) return;

  let csproj = read(csprojPath);
  csproj = csproj
    .replace(/<TargetPlatformVersion Condition=" '\$\(TargetPlatformVersion\)' == '' ">10\.0\.(17763|18362)\.0<\/TargetPlatformVersion>/g, '<TargetPlatformVersion Condition=" \'$(TargetPlatformVersion)\' == \'\' ">10.0.22621.0</TargetPlatformVersion>')
    .replace(/<TargetPlatformMinVersion>10\.0\.(16299|17763)\.0<\/TargetPlatformMinVersion>/g, '<TargetPlatformMinVersion>10.0.18362.0</TargetPlatformMinVersion>')
    .replace('<Version>6.2.12</Version>', '<Version>6.2.14</Version>');
  const duplicateBlock = /<ItemGroup>\s*<PackageReference Include="Microsoft\.NETCore\.UniversalWindowsPlatform">\s*<Version>6\.2\.14<\/Version>\s*<\/PackageReference>\s*<\/ItemGroup>/g;
  const blocks = csproj.match(duplicateBlock);
  if (blocks && blocks.length > 1) {
    let first = true;
    csproj = csproj.replace(duplicateBlock, () => {
      if (first) {
        first = false;
        return '<ItemGroup>\n    <PackageReference Include="Microsoft.NETCore.UniversalWindowsPlatform">\n      <Version>6.2.14</Version>\n    </PackageReference>\n  </ItemGroup>';
      }
      return '';
    });
  }
  if (writeIfChanged(csprojPath, csproj)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, csprojPath)}`);

  if (fs.existsSync(nugetConfigPath)) {
    let nugetConfig = read(nugetConfigPath);
    nugetConfig = nugetConfig.replace(/\s*<add key="react-native" value="https:\/\/pkgs\.dev\.azure\.com\/ms\/react-native\/_packaging\/react-native-public\/nuget\/v3\/index\.json" \/>\r?\n/g, '\n');
    if (writeIfChanged(nugetConfigPath, nugetConfig)) console.log(`${logPrefix}: normalized ${path.relative(repoRoot, nugetConfigPath)}`);
  }
}

function normalizeReactNativeWindowsHeaderOrder({ repoRoot, logPrefix }) {
  const appModelHelpersPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Microsoft.ReactNative.Cxx', 'AppModelHelpers.h');
  if (fs.existsSync(appModelHelpersPath)) {
    let appModelHelpers = read(appModelHelpersPath);
    if (!appModelHelpers.includes('#include <Windows.h>')) {
      appModelHelpers = appModelHelpers.replace('// AppModel helpers\r\n\r\n#include <appmodel.h>', '// AppModel helpers\r\n\r\n#include <Windows.h>\r\n#include <appmodel.h>');
    }
    if (writeIfChanged(appModelHelpersPath, appModelHelpers)) console.log(logPrefix + ': normalized ' + path.relative(repoRoot, appModelHelpersPath));
  }

  const utilsCppPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Shared', 'Utils.cpp');
  if (fs.existsSync(utilsCppPath)) {
    let utilsCpp = read(utilsCppPath);
    if (utilsCpp.includes('SHGetKnownFolderPath')) {
      if (!utilsCpp.includes('#include <cstdlib>')) {
        utilsCpp = utilsCpp.replace('#include <regex>\r\n', '#include <regex>\r\n#include <cstdlib>\r\n');
      }
      utilsCpp = utilsCpp.replace(
        /IAsyncOperation<winrt::hstring> getUnPackagedApplicationDataPath\(const wchar_t \*childFolder\) \{[\s\S]*?\n\}/,
        `IAsyncOperation<winrt::hstring> getUnPackagedApplicationDataPath(const wchar_t *childFolder) {\n  wchar_t *localAppData = nullptr;\n  size_t localAppDataLength = 0;\n  if (_wdupenv_s(&localAppData, &localAppDataLength, L"LOCALAPPDATA") != 0 || !localAppData || localAppDataLength == 0)\n    std::abort();\n\n  std::wstring appDataPath(localAppData);\n  free(localAppData);\n\n  if (!childFolder) {\n    co_return winrt::hstring(appDataPath);\n  } else {\n    std::wostringstream os;\n    os << appDataPath.c_str() << "\\\\" << childFolder;\n    auto childFolderPath = os.str();\n    if (!CreateDirectoryW(childFolderPath.c_str(), NULL) && GetLastError() != ERROR_ALREADY_EXISTS)\n      std::abort();\n    co_return winrt::hstring(childFolderPath);\n  }\n}`
      );
    }
    if (writeIfChanged(utilsCppPath, utilsCpp)) console.log(logPrefix + ': normalized ' + path.relative(repoRoot, utilsCppPath));
  }

  const runtimeTargetConsolePath = path.join(repoRoot, 'node_modules', 'react-native', 'ReactCommon', 'jsinspector-modern', 'RuntimeTargetConsole.cpp');
  if (fs.existsSync(runtimeTargetConsolePath)) {
    let runtimeTargetConsole = read(runtimeTargetConsolePath);
    if (!runtimeTargetConsole.includes('#include <chrono>')) {
      runtimeTargetConsole = runtimeTargetConsole.replace(/#include <concepts>\\r?\\n/, '#include <chrono>\\r\\n#include <concepts>\\r\\n');
    }
    if (writeIfChanged(runtimeTargetConsolePath, runtimeTargetConsole)) console.log(logPrefix + ': normalized ' + path.relative(repoRoot, runtimeTargetConsolePath));
  }

  const textTransformHeaderPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Microsoft.ReactNative', 'Utils', 'TextTransform.h');
  const transformableTextHeaderPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Microsoft.ReactNative', 'Utils', 'TransformableText.h');
  if (fs.existsSync(transformableTextHeaderPath)) {
    let transformableTextHeader = read(transformableTextHeaderPath);
    if (!transformableTextHeader.includes('#include <Windows.h>')) {
      transformableTextHeader = transformableTextHeader.replace('#pragma once', '#pragma once\r\n\r\n#include <Windows.h>');
    }
    transformableTextHeader = transformableTextHeader.replace(/\bLCMapStringW\(/g, 'LCMapStringEx(');
    transformableTextHeader = transformableTextHeader.replace('LOCALE_NAME_USER_DEFAULT, dwMapFlags, originalText.c_str(), static_cast<int>(originalText.size()), nullptr, 0);', 'LOCALE_NAME_USER_DEFAULT, dwMapFlags, originalText.c_str(), static_cast<int>(originalText.size()), nullptr, 0, nullptr, nullptr, 0);');
    transformableTextHeader = transformableTextHeader.replace('const int nChars = LCMapStringEx(\r\n        LOCALE_NAME_USER_DEFAULT,\r\n        dwMapFlags,\r\n        originalText.c_str(),\r\n        static_cast<int>(originalText.size()),\r\n        str.data(),\r\n        reqChars);', 'const int nChars = LCMapStringEx(\r\n        LOCALE_NAME_USER_DEFAULT,\r\n        dwMapFlags,\r\n        originalText.c_str(),\r\n        static_cast<int>(originalText.size()),\r\n        str.data(),\r\n        reqChars,\r\n        nullptr,\r\n        nullptr,\r\n        0);');
    if (writeIfChanged(transformableTextHeaderPath, transformableTextHeader)) console.log(logPrefix + ': normalized ' + path.relative(repoRoot, transformableTextHeaderPath));
  }

  if (fs.existsSync(textTransformHeaderPath)) {
    let textTransformHeader = read(textTransformHeaderPath);
    if (!textTransformHeader.includes('#include <cstdint>')) {
      textTransformHeader = textTransformHeader.replace('#pragma once', '#pragma once\r\n\r\n#include <cstdint>');
    }
    if (writeIfChanged(textTransformHeaderPath, textTransformHeader)) console.log(logPrefix + ': normalized ' + path.relative(repoRoot, textTransformHeaderPath));
  }

  const crashManagerHeaderPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Microsoft.ReactNative', 'ReactHost', 'CrashManager.h');
  if (fs.existsSync(crashManagerHeaderPath)) {
    let crashManagerHeader = read(crashManagerHeaderPath);
    if (!crashManagerHeader.includes('#include <string>')) {
      crashManagerHeader = crashManagerHeader.replace('#include <atomic>\r\n', '#include <atomic>\r\n#include <string>\r\n');
    }
    if (writeIfChanged(crashManagerHeaderPath, crashManagerHeader)) console.log(logPrefix + ': normalized ' + path.relative(repoRoot, crashManagerHeaderPath));
  }

  const reactDispatcherHeaderPath = path.join(repoRoot, 'node_modules', 'react-native-windows', 'Microsoft.ReactNative', 'IReactDispatcher.h');
  if (fs.existsSync(reactDispatcherHeaderPath)) {
    let reactDispatcherHeader = read(reactDispatcherHeaderPath);
    if (!reactDispatcherHeader.includes('#include <unknwn.h>')) {
      reactDispatcherHeader = reactDispatcherHeader.replace('#pragma once\r\n', '#pragma once\r\n#include <unknwn.h>\r\n');
    }
    if (writeIfChanged(reactDispatcherHeaderPath, reactDispatcherHeader)) console.log(logPrefix + ': normalized ' + path.relative(repoRoot, reactDispatcherHeaderPath));
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const appRoot = path.join(repoRoot, 'apps', 'poliverai');
  const logPrefix = 'patch-react-native-windows-projects';
  normalizeWindowsProjectPaths({ repoRoot, appRoot, logPrefix });
  normalizeReactNativeWindowsBuildSettings({ repoRoot, logPrefix });
  normalizeReactNativeWindowsHeaderOrder({ repoRoot, logPrefix });
  normalizeDocumentPickerWindowsSupport({ repoRoot, logPrefix });
}

main();

