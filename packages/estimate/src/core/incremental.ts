import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, PhaseResult, SourceFiles } from "../types";

/** File fingerprint for change detection */
interface FileFingerprint {
  path: string;
  hash: string;
  sizeBytes: number;
  mtimeMs: number;
}

/** Cached phase result (serializable subset of PhaseResult) */
interface CachedPhaseResult {
  phase: string;
  passed: boolean;
  score: number;
  maxScore: number;
  weightedScore: number;
  durationMs: number;
  metrics?: Record<string, number | string | boolean>;
  issueCount: number;
}

/** Incremental evaluation cache */
export interface IncrementalCache {
  version: number;
  evaluatedAt: string;
  fingerprints: FileFingerprint[];
  /** Cached phase results from previous evaluation */
  phaseResults?: Record<string, CachedPhaseResult>;
  /** Hash of docs/ directory contents for documentQuality change detection */
  docsHash?: string;
  /** Whether agent evaluation was included in this cache */
  agent?: boolean;
}

const CACHE_VERSION = 2;
const CACHE_FILENAME = ".estimate-cache.json";

/** Compute MD5 hash of file content */
function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf-8");
  return crypto.createHash("md5").update(content).digest("hex");
}

/** Compute hash of docs/ directory (for documentQuality change detection) */
function hashDocsDir(rootPath: string): string {
  const docsPath = path.join(rootPath, "docs");
  if (!fs.existsSync(docsPath)) return "";
  const hash = crypto.createHash("md5");
  const files = findFilesRecursive(docsPath);
  for (const f of files.sort()) {
    try {
      hash.update(f);
      hash.update(fs.readFileSync(f, "utf-8"));
    } catch {
      // skip unreadable
    }
  }
  return hash.digest("hex");
}

function findFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findFilesRecursive(fullPath));
      else results.push(fullPath);
    }
  } catch {
    // skip unreadable dirs
  }
  return results;
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

/** Save cache to project root, including phase results */
export function saveCache(
  context: EvaluationContext,
  phaseResults?: Record<string, PhaseResult>,
  agent?: boolean,
): void {
  const cachedPhases: Record<string, CachedPhaseResult> = {};
  if (phaseResults) {
    for (const [key, result] of Object.entries(phaseResults)) {
      cachedPhases[key] = {
        phase: result.phase,
        passed: result.passed,
        score: result.score,
        maxScore: result.maxScore,
        weightedScore: result.weightedScore,
        durationMs: result.durationMs,
        metrics: result.metrics,
        issueCount: result.issues.length,
      };
    }
  }

  const cache: IncrementalCache = {
    version: CACHE_VERSION,
    evaluatedAt: new Date().toISOString(),
    fingerprints: buildFingerprints(context),
    phaseResults:
      Object.keys(cachedPhases).length > 0 ? cachedPhases : undefined,
    docsHash: hashDocsDir(context.project.rootPath),
    agent,
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
  /** Whether docs/ directory changed */
  docsChanged: boolean;
  /** Changed file categories (which SourceFiles categories have changes) */
  changedCategories: Set<SourceFileCategory>;
}

export type SourceFileCategory =
  | "controllers"
  | "providers"
  | "structures"
  | "tests"
  | "prismaSchemas"
  | "docs";

/**
 * Phase dependency map: which file categories affect each scoring phase.
 *
 * DocumentQuality → docs/ directory requirementsCoverage → controllers,
 * providers, structures, docs testCoverage → tests, controllers
 * logicCompleteness → controllers, providers apiCompleteness → controllers
 */
export const PHASE_DEPENDENCIES: Record<string, SourceFileCategory[]> = {
  documentQuality: ["docs"],
  requirementsCoverage: ["controllers", "providers", "structures", "docs"],
  testCoverage: ["tests", "controllers"],
  logicCompleteness: ["controllers", "providers"],
  apiCompleteness: ["controllers"],
};

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
  const requiresFullEval =
    prismaChanged || changeRatio > 0.3 || removed.length > 0;

  // Check docs/ directory change
  const currentDocsHash = hashDocsDir(context.project.rootPath);
  const docsChanged = currentDocsHash !== (cache.docsHash ?? "");

  // Determine which file categories have changes
  const changedSet = new Set([...changed, ...added]);
  const changedCategories = new Set<SourceFileCategory>();

  if (docsChanged) changedCategories.add("docs");
  if (prismaChanged) changedCategories.add("prismaSchemas");

  const categoryArrays: [SourceFileCategory, string[]][] = [
    ["controllers", context.files.controllers],
    ["providers", context.files.providers],
    ["structures", context.files.structures],
    ["tests", context.files.tests],
  ];
  for (const [category, files] of categoryArrays) {
    if (files.some((f) => changedSet.has(f))) {
      changedCategories.add(category);
    }
  }

  return {
    changed,
    added,
    removed,
    unchangedCount,
    requiresFullEval,
    docsChanged,
    changedCategories,
  };
}

/**
 * Check if a phase can reuse cached results based on changed file categories.
 * Returns true if the phase's dependencies have NOT changed.
 */
export function canReusePhase(
  phaseKey: string,
  diff: IncrementalDiff,
): boolean {
  const deps = PHASE_DEPENDENCIES[phaseKey];
  if (!deps) return false; // unknown phase → always re-run
  return !deps.some((cat) => diff.changedCategories.has(cat));
}

/** Convert cached phase result back to PhaseResult (with empty issues array) */
export function restorePhaseResult(cached: CachedPhaseResult): PhaseResult {
  return {
    phase: cached.phase as PhaseResult["phase"],
    passed: cached.passed,
    score: cached.score,
    maxScore: cached.maxScore,
    weightedScore: cached.weightedScore,
    issues: [], // Issues are not cached — they can be large and are regenerated
    durationMs: 0, // Mark as 0 since this was a cache hit
    metrics: {
      ...cached.metrics,
      cached: true,
      originalDurationMs: cached.durationMs,
    },
  };
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
