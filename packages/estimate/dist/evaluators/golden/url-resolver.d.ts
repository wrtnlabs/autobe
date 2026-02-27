export interface RouteInfo {
    controller: string;
    method: string;
    fullPath: string;
    filePath: string;
}
export interface ResolvedEndpoint {
    url: string;
    method: string;
}
export declare function buildRouteMap(rootPath: string): RouteInfo[];
export declare function findEndpoint(routes: RouteInfo[], options: {
    pathKeywords: string[];
    mustContain?: string;
    method?: string;
}): ResolvedEndpoint | null;
//# sourceMappingURL=url-resolver.d.ts.map