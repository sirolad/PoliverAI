const lazy = (moduleName, requireFn) => {
  const importLazyLocal = require("../compiled/import-lazy")(requireFn);
  return importLazyLocal(moduleName);
};
const Import = {
  lazy
};
export {
  Import,
  lazy as lazyImport
};
