var isOverriddenConfigKey = function(key) {
  return [
    "removeConsole",
    "enableInlineScripts",
    "enableInlineStyles",
    "baseUrl"
  ].includes(key);
};
export {
  isOverriddenConfigKey
};
