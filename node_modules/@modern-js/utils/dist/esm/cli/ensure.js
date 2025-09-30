import path from "path";
var ensureAbsolutePath = function(base, filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(base, filePath);
};
var ensureArray = function(params) {
  if (Array.isArray(params)) {
    return params;
  }
  return [
    params
  ];
};
export {
  ensureAbsolutePath,
  ensureArray
};
