const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'macos', 'build', 'generated', 'ios');
fs.mkdirSync(outDir, { recursive: true });

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
