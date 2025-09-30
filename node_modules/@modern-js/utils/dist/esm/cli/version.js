function isVersionAtLeast1819() {
  var nodeVersion = process.versions.node;
  var versionArr = nodeVersion.split(".").map(Number);
  return versionArr[0] > 18 || versionArr[0] === 18 && versionArr[1] >= 19;
}
function isVersionAtLeast18() {
  var nodeVersion = process.versions.node;
  var versionArr = nodeVersion.split(".").map(Number);
  return versionArr[0] >= 18;
}
function isVersionAtLeast22() {
  var nodeVersion = process.versions.node;
  var versionArr = nodeVersion.split(".").map(Number);
  return versionArr[0] >= 22;
}
function isVersionAtLeast20() {
  var nodeVersion = process.versions.node;
  var versionArr = nodeVersion.split(".").map(Number);
  return versionArr[0] >= 20;
}
export {
  isVersionAtLeast18,
  isVersionAtLeast1819,
  isVersionAtLeast20,
  isVersionAtLeast22
};
