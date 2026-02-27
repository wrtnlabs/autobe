"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRouteMap = buildRouteMap;
exports.findEndpoint = findEndpoint;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function buildRouteMap(rootPath) {
    const controllersPath = path.join(rootPath, "src", "controllers");
    if (!fs.existsSync(controllersPath))
        return [];
    const routes = [];
    const files = findTsFiles(controllersPath);
    for (const filePath of files) {
        const content = fs.readFileSync(filePath, "utf-8");
        const controllerMatch = content.match(/@Controller\("([^"]+)"\)/);
        if (!controllerMatch)
            continue;
        const basePath = controllerMatch[1];
        const routeRegex = /@TypedRoute\.(Get|Post|Patch|Put|Delete)\((?:"([^"]*)")?\)/g;
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
function findEndpoint(routes, options) {
    const { pathKeywords, mustContain, method } = options;
    const candidates = routes.filter((r) => {
        if (method && r.method !== method.toUpperCase())
            return false;
        if (mustContain && !r.fullPath.toLowerCase().includes(mustContain.toLowerCase()))
            return false;
        return pathKeywords.some((kw) => r.fullPath.toLowerCase().includes(kw.toLowerCase()));
    });
    if (candidates.length === 0)
        return null;
    candidates.sort((a, b) => b.fullPath.length - a.fullPath.length);
    return { url: candidates[0].fullPath, method: candidates[0].method };
}
function findTsFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory())
            results.push(...findTsFiles(fullPath));
        else if (entry.name.endsWith(".ts"))
            results.push(fullPath);
    }
    return results;
}
//# sourceMappingURL=url-resolver.js.map