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
var type_exports = {};
__export(type_exports, {
  isArray: () => isArray,
  isEmpty: () => isEmpty,
  isFunction: () => isFunction,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  isPromise: () => isPromise,
  isRegExp: () => isRegExp,
  isString: () => isString,
  isUndefined: () => isUndefined
});
module.exports = __toCommonJS(type_exports);
function isString(str) {
  return typeof str === "string";
}
function isUndefined(obj) {
  return typeof obj === "undefined";
}
function isArray(obj) {
  return Array.isArray(obj);
}
function isFunction(func) {
  return typeof func === "function";
}
function isObject(obj) {
  return obj !== null && typeof obj === "object";
}
function isPlainObject(obj) {
  return isObject(obj) && Object.prototype.toString.call(obj) === "[object Object]";
}
function isPromise(obj) {
  return Boolean(obj) && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
}
function isRegExp(obj) {
  return Object.prototype.toString.call(obj) === "[object RegExp]";
}
const isEmpty = (o) => Object.entries(o).length === 0 && o.constructor === Object;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isArray,
  isEmpty,
  isFunction,
  isObject,
  isPlainObject,
  isPromise,
  isRegExp,
  isString,
  isUndefined
});
