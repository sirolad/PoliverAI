import type { NestedRouteForCli, PageRoute } from '@modern-js/types';
export declare function filterRoutesForServer(routes: (NestedRouteForCli | PageRoute)[]): (NestedRouteForCli | PageRoute)[];
export declare function filterRoutesLoader(routes: (NestedRouteForCli | PageRoute)[]): (NestedRouteForCli | PageRoute)[];
export declare function markRoutes(routes: (NestedRouteForCli | PageRoute)[], routeIds: string[]): (NestedRouteForCli | PageRoute)[];
