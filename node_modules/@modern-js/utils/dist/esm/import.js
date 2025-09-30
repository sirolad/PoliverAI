var lazy = function(moduleName, requireFn) {
  var importLazyLocal = require("../compiled/import-lazy")(requireFn);
  return importLazyLocal(moduleName);
};
var Import = {
  lazy
};
export {
  Import,
  lazy as lazyImport
};
