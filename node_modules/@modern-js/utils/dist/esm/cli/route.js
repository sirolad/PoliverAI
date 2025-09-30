import { lodash } from "../compiled";
var cloneDeep = lodash.cloneDeep;
function filterRoutesForServer(routes) {
  var clonedRoutes = cloneDeep(routes);
  var newRoutes = clonedRoutes.map(function(route) {
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
  }).filter(function(route) {
    return route !== null;
  });
  return newRoutes;
}
function filterRoutesLoader(routes) {
  var clonedRoutes = cloneDeep(routes);
  var newRoutes = clonedRoutes.map(function(route) {
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
  }).filter(function(route) {
    return route !== null;
  });
  return newRoutes;
}
function markRoutes(routes, routeIds) {
  return routes.map(function(route) {
    if (route.type !== "nested") {
      return route;
    }
    if (route.children && route.children.length > 0) {
      route.children = markRoutes(route.children, routeIds);
    }
    if (route.children && route.children.length > 0) {
      route.inValidSSRRoute = route.children.every(function(child) {
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
