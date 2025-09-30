import path from "path";
const ensureAbsolutePath = (base, filePath) => path.isAbsolute(filePath) ? filePath : path.resolve(base, filePath);
const ensureArray = (params) => {
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
