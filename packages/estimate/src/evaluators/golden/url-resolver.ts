import * as fs from "fs";
import * as path from "path";

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

export function buildRouteMap(rootPath: string): RouteInfo[] {
  const controllersPath = path.join(rootPath, "src", "controllers");
  if (!fs.existsSync(controllersPath)) return [];

  const routes: RouteInfo[] = [];
  const files = findTsFiles(controllersPath);

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const controllerMatch = content.match(/@Controller\("([^"]+)"\)/);
    if (!controllerMatch) continue;

    const basePath = controllerMatch[1];
    const routeRegex =
      /@TypedRoute\.(Get|Post|Patch|Put|Delete)\((?:"([^"]*)")?\)/g;
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const suffix = match[2] || "";
      const fullPath = suffix ? `${basePath}/${suffix}` : basePath;
      routes.push({ controller: basePath, method, fullPath, filePath });
    }
  }

  return routes;
}

/** Options for finding an endpoint */
export interface FindEndpointOptions {
  pathKeywords: string[];
  mustContain?: string;
  method?: string;
}

export function findEndpoint(
  routes: RouteInfo[],
  options: FindEndpointOptions,
): ResolvedEndpoint | null {
  const { pathKeywords, mustContain, method } = options;

  const candidates = routes.filter((r) => {
    if (method && r.method !== method.toUpperCase()) return false;
    if (
      mustContain &&
      !r.fullPath.toLowerCase().includes(mustContain.toLowerCase())
    )
      return false;
    return pathKeywords.some((kw) =>
      r.fullPath.toLowerCase().includes(kw.toLowerCase()),
    );
  });

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.fullPath.length - a.fullPath.length);
  return { url: candidates[0].fullPath, method: candidates[0].method };
}

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findTsFiles(fullPath));
    else if (entry.name.endsWith(".ts")) results.push(fullPath);
  }
  return results;
}
