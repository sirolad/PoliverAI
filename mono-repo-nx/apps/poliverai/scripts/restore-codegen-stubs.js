const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'macos', 'build', 'generated', 'ios');
fs.mkdirSync(outDir, { recursive: true });

function copyDirectoryContents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return false;

  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryContents(sourcePath, targetPath);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }

  return true;
}

function isRealGeneratedPodspec(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return !content.includes('Temporary stub for ReactCodegen');
}

const canonicalGeneratedDir = path.join(__dirname, '..', 'ios', 'build', 'generated', 'ios');
const canonicalReactCodegenPodspec = path.join(canonicalGeneratedDir, 'ReactCodegen.podspec');

if (isRealGeneratedPodspec(canonicalReactCodegenPodspec)) {
  copyDirectoryContents(canonicalGeneratedDir, outDir);
  console.log('Copied real generated codegen artifacts to', outDir);
  process.exit(0);
}

const reactCodegen = `Pod::Spec.new do |s|
  s.name       = "ReactCodegen"
  s.version    = "0.0.0"
  s.summary    = "Temporary stub for ReactCodegen generated podspec (disabled codegen)."
  s.homepage   = "https://reactnative.dev/"
  s.license    = { :type => 'MIT' }
  s.authors    = { 'Local' => 'local@example.com' }
  s.platforms  = { :ios => '11.0', :osx => '11.0' }
  s.source     = { :git => '' }
  s.source_files = "README.md"
end
`;

const appDep = `Pod::Spec.new do |s|
  s.name       = "ReactAppDependencyProvider"
  s.version    = "0.0.0"
  s.summary    = "Temporary stub for ReactAppDependencyProvider generated podspec (disabled codegen)."
  s.homepage   = "https://reactnative.dev/"
  s.license    = { :type => 'MIT' }
  s.authors    = { 'Local' => 'local@example.com' }
  s.platforms  = { :ios => '11.0', :osx => '11.0' }
  s.source     = { :git => '' }
  s.source_files = "README.md"
  s.dependency "ReactCodegen"
end
`;

fs.writeFileSync(path.join(outDir, 'ReactCodegen.podspec'), reactCodegen);
fs.writeFileSync(path.join(outDir, 'ReactAppDependencyProvider.podspec'), appDep);
console.log('Wrote temporary codegen stub podspecs to', outDir);
