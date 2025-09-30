var getNodeEnv = function() {
  return process.env.NODE_ENV || "development";
};
var isDev = function() {
  return getNodeEnv() === "development";
};
var isProd = function() {
  return getNodeEnv() === "production";
};
var isTest = function() {
  return getNodeEnv() === "test";
};
var isBrowser = function() {
  return typeof window !== "undefined";
};
export {
  getNodeEnv,
  isBrowser,
  isDev,
  isProd,
  isTest
};
