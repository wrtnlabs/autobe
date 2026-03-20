import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, SourceFiles } from "../types";

/** File fingerprint for change detection */
interface FileFingerprint {
  path: string;
  hash: string;
  sizeBytes: number;
  mtimeMs: number;
}

/** Incremental evaluation cache */
export interface IncrementalCache {
  version: number;
  evaluatedAt: string;
  fingerprints: FileFingerprint[];
}

const CACHE_VERSION = 1;
const CACHE_FILENAME = ".estimate-cache.json";

/** Compute MD5 hash of file content */
function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf-8");
  return crypto.createHash("md5").update(content).digest("hex");
}

/** Build fingerprints for all source files */
function buildFingerprints(context: EvaluationContext): FileFingerprint[] {
  const allFiles = [
    ...context.files.typescript,
    ...context.files.prismaSchemas,
  ];

  const fingerprints: FileFingerprint[] = [];
  for (const filePath of allFiles) {
    try {
      const stat = fs.statSync(filePath);
      fingerprints.push({
        path: path.relative(context.project.rootPath, filePath),
        hash: hashFile(filePath),
        sizeBytes: stat.size,
        mtimeMs: stat.mtimeMs,
      });
    } catch {
      // skip unreadable files
    }
  }

  return fingerprints;
}

/** Load cache from project root */
export function loadCache(rootPath: string): IncrementalCache | null {
  const cachePath = path.join(rootPath, CACHE_FILENAME);
  try {
    if (!fs.existsSync(cachePath)) return null;
    const data = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    if (data.version !== CACHE_VERSION) return null;
    return data as IncrementalCache;
  } catch {
    return null;
  }
}

/** Save cache to project root */
export function saveCache(context: EvaluationContext): void {
  const cache: IncrementalCache = {
    version: CACHE_VERSION,
    evaluatedAt: new Date().toISOString(),
    fingerprints: buildFingerprints(context),
  };

  const cachePath = path.join(context.project.rootPath, CACHE_FILENAME);
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

/** Diff result between current files and cache */
export interface IncrementalDiff {
  /** Files that changed since last evaluation */
  changed: string[];
  /** Files that are new (not in cache) */
  added: string[];
  /** Files that were removed (in cache but not on disk) */
  removed: string[];
  /** Total files unchanged */
  unchangedCount: number;
  /** Whether a full re-evaluation is needed */
  requiresFullEval: boolean;
}

/** Compare current context against cache to find changed files */
export function computeDiff(
  context: EvaluationContext,
  cache: IncrementalCache,
): IncrementalDiff {
  const cacheMap = new Map<string, FileFingerprint>();
  for (const fp of cache.fingerprints) {
    cacheMap.set(fp.path, fp);
  }

  const changed: string[] = [];
  const added: string[] = [];
  const currentPaths = new Set<string>();

  const allFiles = [
    ...context.files.typescript,
    ...context.files.prismaSchemas,
  ];

  for (const filePath of allFiles) {
    const relative = path.relative(context.project.rootPath, filePath);
    currentPaths.add(relative);

    const cached = cacheMap.get(relative);
    if (!cached) {
      added.push(filePath);
      continue;
    }

    try {
      const stat = fs.statSync(filePath);
      // Quick check: if mtime unchanged and same size, skip hash
      if (stat.mtimeMs === cached.mtimeMs && stat.size === cached.sizeBytes) {
        continue;
      }
      // Full check: compare hash
      const hash = hashFile(filePath);
      if (hash !== cached.hash) {
        changed.push(filePath);
      }
    } catch {
      changed.push(filePath);
    }
  }

  const removed = cache.fingerprints
    .filter((fp) => !currentPaths.has(fp.path))
    .map((fp) => fp.path);

  const totalChanged = changed.length + added.length + removed.length;
  const unchangedCount = allFiles.length - changed.length - added.length;

  // Require full eval if Prisma schemas changed or >30% of files changed
  const prismaChanged =
    changed.some((f) => f.endsWith(".prisma")) ||
    added.some((f) => f.endsWith(".prisma"));
  const changeRatio = totalChanged / Math.max(allFiles.length, 1);
  const requiresFullEval = prismaChanged || changeRatio > 0.3 || removed.length > 0;

  return { changed, added, removed, unchangedCount, requiresFullEval };
}

/** Filter source files to only include changed/added files */
export function filterToChanged(
  files: SourceFiles,
  changedPaths: Set<string>,
): SourceFiles {
  const filter = (arr: string[]) => arr.filter((f) => changedPaths.has(f));

  return {
    typescript: filter(files.typescript),
    controllers: filter(files.controllers),
    providers: filter(files.providers),
    structures: filter(files.structures),
    tests: filter(files.tests),
    prismaSchemas: filter(files.prismaSchemas),
  };
}
