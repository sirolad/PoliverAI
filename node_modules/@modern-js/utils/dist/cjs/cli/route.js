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
var route_exports = {};
__export(route_exports, {
  filterRoutesForServer: () => filterRoutesForServer,
  filterRoutesLoader: () => filterRoutesLoader,
  markRoutes: () => markRoutes
});
module.exports = __toCommonJS(route_exports);
var import_compiled = require("../compiled");
const { cloneDeep } = import_compiled.lodash;
function filterRoutesForServer(routes) {
  const clonedRoutes = cloneDeep(routes);
  const newRoutes = clonedRoutes.map((route) => {
    if (route.type !== "nested") {
      return route;
    }
    if (route.children && route.children.length > 0) {
      route.children = filterRoutesForServer(route.children);
    }
    if (route.inValidSSRRoute) {
      return null;
    }
    return route;
  }).filter((route) => route !== null);
  return newRoutes;
}
function filterRoutesLoader(routes) {
  const clonedRoutes = cloneDeep(routes);
  const newRoutes = clonedRoutes.map((route) => {
    if (route.type !== "nested") {
      return route;
    }
    if (route.children && route.children.length > 0) {
      route.children = filterRoutesLoader(route.children);
    }
    if (route.inValidSSRRoute) {
      delete route.loader;
      delete route.data;
      delete route.action;
    }
    return route;
  }).filter((route) => route !== null);
  return newRoutes;
}
function markRoutes(routes, routeIds) {
  return routes.map((route) => {
    if (route.type !== "nested") {
      return route;
    }
    if (route.children && route.children.length > 0) {
      route.children = markRoutes(route.children, routeIds);
    }
    if (route.children && route.children.length > 0) {
      route.inValidSSRRoute = route.children.every((child) => {
        var _child_inValidSSRRoute;
        return (_child_inValidSSRRoute = child.inValidSSRRoute) !== null && _child_inValidSSRRoute !== void 0 ? _child_inValidSSRRoute : false;
      });
    } else if (route.id) {
      route.inValidSSRRoute = !routeIds.includes(route.id);
    }
    return route;
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  filterRoutesForServer,
  filterRoutesLoader,
  markRoutes
});
