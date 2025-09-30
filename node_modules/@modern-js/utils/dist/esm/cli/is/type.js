import { _ as _type_of } from "@swc/helpers/_/_type_of";
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
  return obj !== null && (typeof obj === "undefined" ? "undefined" : _type_of(obj)) === "object";
}
function isPlainObject(obj) {
  return isObject(obj) && Object.prototype.toString.call(obj) === "[object Object]";
}
function isPromise(obj) {
  return Boolean(obj) && ((typeof obj === "undefined" ? "undefined" : _type_of(obj)) === "object" || typeof obj === "function") && typeof obj.then === "function";
}
function isRegExp(obj) {
  return Object.prototype.toString.call(obj) === "[object RegExp]";
}
var isEmpty = function(o) {
  return Object.entries(o).length === 0 && o.constructor === Object;
};
export {
  isArray,
  isEmpty,
  isFunction,
  isObject,
  isPlainObject,
  isPromise,
  isRegExp,
  isString,
  isUndefined
};
