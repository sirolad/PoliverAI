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
