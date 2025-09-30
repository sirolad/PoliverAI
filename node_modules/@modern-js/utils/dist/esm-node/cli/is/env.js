const getNodeEnv = () => process.env.NODE_ENV || "development";
const isDev = () => getNodeEnv() === "development";
const isProd = () => getNodeEnv() === "production";
const isTest = () => getNodeEnv() === "test";
const isBrowser = () => typeof window !== "undefined";
export {
  getNodeEnv,
  isBrowser,
  isDev,
  isProd,
  isTest
};
