const isOverriddenConfigKey = (key) => [
  "removeConsole",
  "enableInlineScripts",
  "enableInlineStyles",
  "baseUrl"
].includes(key);
export {
  isOverriddenConfigKey
};
