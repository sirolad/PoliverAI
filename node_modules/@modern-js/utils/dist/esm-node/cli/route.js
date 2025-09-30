import { lodash } from "../compiled";
const { cloneDeep } = lodash;
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
export {
  filterRoutesForServer,
  filterRoutesLoader,
  markRoutes
};
