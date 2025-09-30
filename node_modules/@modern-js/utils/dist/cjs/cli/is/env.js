"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var env_exports = {};
__export(env_exports, {
  getNodeEnv: () => getNodeEnv,
  isBrowser: () => isBrowser,
  isDev: () => isDev,
  isProd: () => isProd,
  isTest: () => isTest
});
module.exports = __toCommonJS(env_exports);
const getNodeEnv = () => process.env.NODE_ENV || "development";
const isDev = () => getNodeEnv() === "development";
const isProd = () => getNodeEnv() === "production";
const isTest = () => getNodeEnv() === "test";
const isBrowser = () => typeof window !== "undefined";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getNodeEnv,
  isBrowser,
  isDev,
  isProd,
  isTest
});
