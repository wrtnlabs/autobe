import * as fs from "fs";

import type {
  EvaluationContext,
  Issue,
  PhaseResult,
  RuntimeTestResult,
} from "../../types";
import { PHASE_WEIGHTS, createIssue } from "../../types";
import { BaseEvaluator } from "../base";
import { type RouteInfo, buildRouteMap } from "../golden/url-resolver";

/** Route-level test coverage analysis */
export namespace RouteCoverage {
  /** Parsed information about what route a test targets */
  export interface TestRouteTarget {
    filePath: string;
    accessorSegments: string[];
    inferredMethod: string;
    inferredPath: string;
  }

  /** Coverage status for a single route */
  export interface RouteCoverageStatus {
    route: RouteInfo;
    covered: boolean;
    coveringTests: string[];
  }

  /** Per-controller coverage summary */
  export interface ControllerCoverage {
    basePath: string;
    totalRoutes: number;
    coveredRoutes: number;
    coverageRatio: number;
  }

  /** Full route coverage analysis result */
  export interface AnalysisResult {
    totalRoutes: number;
    coveredRoutes: number;
    routeCoverageRatio: number;
    controllerCoverage: ControllerCoverage[];
    testedMethods: Set<string>;
    definedMethods: Set<string>;
    routeStatuses: RouteCoverageStatus[];
  }
}

/**
 * Action name → HTTP method(s) mapping. Some actions map to multiple methods
 * (e.g. "update" can be PUT or PATCH depending on the generator).
 */
const ACTION_TO_METHODS: Record<string, string[]> = {
  // POST
  join: ["POST"],
  create: ["POST"],
  store: ["POST"],
  register: ["POST"],
  sign: ["POST"],
  login: ["POST"],
  refresh: ["POST"],
  restore: ["POST"],
  verify: ["POST"],
  // GET
  index: ["GET"],
  get: ["GET"],
  at: ["GET"],
  find: ["GET"],
  search: ["GET"],
  list: ["GET"],
  read: ["GET"],
  // PUT / PATCH — "update" may be either depending on the code generator
  update: ["PUT", "PATCH"],
  patch: ["PATCH"],
  modify: ["PUT", "PATCH"],
  process: ["PATCH"],
  // DELETE
  delete: ["DELETE"],
  erase: ["DELETE"],
  remove: ["DELETE"],
  destroy: ["DELETE"],
  // PUT
  put: ["PUT"],
  replace: ["PUT"],
  upsert: ["PUT"],
};

/**
 * Infer HTTP method(s) from a compound action name like
 * `updateTodoEditHistoryEntryChange` or `restoreFromTrash`. Falls back to
 * ACTION_TO_METHODS lookup on the full name, then tries the first camelCase
 * word as a prefix. Returns an array of possible methods.
 */
function inferMethodsFromAction(action: string): string[] {
  if (ACTION_TO_METHODS[action]) return ACTION_TO_METHODS[action];
  // Extract the first camelCase word: "restoreFromTrash" → "restore"
  const prefixMatch = action.match(/^([a-z]+)/);
  if (prefixMatch && ACTION_TO_METHODS[prefixMatch[1]]) {
    return ACTION_TO_METHODS[prefixMatch[1]];
  }
  return ["UNKNOWN"];
}

/** Test quality analysis result */
interface TestQuality {
  stubCount: number;
  withAssertions: number;
  qualityRatio: number;
}

export class TestCoverageEvaluator extends BaseEvaluator {
  readonly name = "TestCoverageEvaluator";
  readonly phase = "testCoverage" as const;
  readonly description = "Evaluates test coverage with route-level analysis";

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    // Runtime path (unchanged)
    if (
      context.runtimeResult?.serverStarted &&
      context.runtimeResult.testResults
    ) {
      return this.evaluateFromRuntime(
        context.runtimeResult.testResults,
        startTime,
      );
    }

    const testCount = context.files.tests.length;
    const controllerCount = context.files.controllers.length;

    if (testCount === 0) {
      issues.push(
        createIssue({
          severity: "critical",
          category: "test",
          code: "TEST001",
          message: "No test files found",
        }),
      );
      return {
        phase: "testCoverage",
        passed: true,
        score: 0,
        maxScore: 100,
        weightedScore: 0,
        issues,
        durationMs: Math.round(performance.now() - startTime),
        metrics: {
          testCount: 0,
          controllerCount,
          routeAnalysis: false,
          runtimeVerified: false,
        },
      };
    }

    const quality = this.analyzeTestQuality(context.files.tests, issues);
    const routes = buildRouteMap(context.project.rootPath);

    let score: number;
    let metrics: Record<string, number | string | boolean>;

    if (routes.length > 0) {
      // Route-based analysis
      const testTargets = this.parseTestRouteTargets(context.files.tests);
      const analysis = this.analyzeRouteCoverage(routes, testTargets);
      score = this.computeRouteBasedScore(analysis, quality, issues);

      metrics = {
        testCount,
        controllerCount,
        routeAnalysis: true,
        totalRoutes: analysis.totalRoutes,
        coveredRoutes: analysis.coveredRoutes,
        routeCoveragePercent: Math.round(analysis.routeCoverageRatio * 100),
        definedMethods: [...analysis.definedMethods].join(","),
        testedMethods: [...analysis.testedMethods].join(","),
        controllersAnalyzed: analysis.controllerCoverage.length,
        stubTests: quality.stubCount,
        assertionTests: quality.withAssertions,
        runtimeVerified: false,
      };
    } else {
      // Fallback: naive analysis (no @Controller/@TypedRoute found)
      const coverageRatio =
        controllerCount > 0
          ? Math.min(testCount / controllerCount, 1)
          : testCount > 0
            ? 1
            : 0;

      score = this.computeCoverageScore(
        testCount,
        controllerCount,
        coverageRatio,
        quality,
        issues,
      );

      metrics = {
        testCount,
        controllerCount,
        routeAnalysis: false,
        coverageRatio: Math.round(coverageRatio * 100),
        stubTests: quality.stubCount,
        assertionTests: quality.withAssertions,
        runtimeVerified: false,
        note: "No routes extracted; using controller-name fallback",
      };
    }

    return {
      phase: "testCoverage",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * PHASE_WEIGHTS.testCoverage,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics,
    };
  }

  // ── Route-based analysis ──────────────────────────────

  private parseTestRouteTargets(
    testFiles: string[],
  ): RouteCoverage.TestRouteTarget[] {
    const targets: RouteCoverage.TestRouteTarget[] = [];
    const callPattern = /\.functional\.([\w.]+)\s*\(/g;

    for (const filePath of testFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const seen = new Set<string>();

        let match: RegExpExecArray | null;
        while ((match = callPattern.exec(content)) !== null) {
          const fullAccessor = match[1];
          if (seen.has(fullAccessor)) continue;
          seen.add(fullAccessor);

          const segments = fullAccessor.split(".");
          if (segments.length < 2) continue;

          const action = segments[segments.length - 1];
          const pathSegments = segments.slice(0, -1);
          const inferredMethods = inferMethodsFromAction(action);

          // Primary target: action excluded from path (e.g. `.todos.create` → path=/todos, POST)
          const inferredPath = "/" + pathSegments.join("/");
          for (const inferredMethod of inferredMethods) {
            targets.push({
              filePath,
              accessorSegments: segments,
              inferredMethod,
              inferredPath,
            });
          }

          // Secondary target: action IS a path segment (e.g. `.auth.member.join` where
          // route is `/auth/member/join` with POST). Include action in path so it can
          // match routes where the action name appears as the URL suffix.
          const actionNorm = TestCoverageEvaluator.normalizeSegment(action);
          const methodKeywords = [
            "at",
            "index",
            "get",
            "find",
            "search",
            "list",
            "read",
            "create",
            "store",
            "update",
            "patch",
            "modify",
            "erase",
            "remove",
            "destroy",
            "put",
            "replace",
            "upsert",
          ];
          if (!methodKeywords.includes(actionNorm)) {
            for (const inferredMethod of inferredMethods) {
              targets.push({
                filePath,
                accessorSegments: segments,
                inferredMethod,
                inferredPath: "/" + segments.join("/"),
              });
            }
          }
        }
        callPattern.lastIndex = 0;
      } catch {
        // skip unreadable files
      }
    }

    return targets;
  }

  private analyzeRouteCoverage(
    routes: RouteInfo[],
    testTargets: RouteCoverage.TestRouteTarget[],
  ): RouteCoverage.AnalysisResult {
    const routeStatuses: RouteCoverage.RouteCoverageStatus[] = [];
    const definedMethods = new Set<string>();
    const testedMethods = new Set<string>();
    const controllerMap = new Map<string, { total: number; covered: number }>();

    for (const route of routes) {
      definedMethods.add(route.method);
      const routeSegments = this.normalizePathSegments(route.fullPath);

      const coveringTests: string[] = [];
      for (const target of testTargets) {
        if (target.inferredMethod !== route.method) continue;
        const targetSegments = this.normalizePathSegments(target.inferredPath);
        if (this.segmentsMatch(routeSegments, targetSegments)) {
          coveringTests.push(target.filePath);
          testedMethods.add(route.method);
        }
      }

      const covered = coveringTests.length > 0;
      routeStatuses.push({ route, covered, coveringTests });

      const ctrl = controllerMap.get(route.controller) ?? {
        total: 0,
        covered: 0,
      };
      ctrl.total++;
      if (covered) ctrl.covered++;
      controllerMap.set(route.controller, ctrl);
    }

    const totalRoutes = routes.length;
    const coveredRoutes = routeStatuses.filter((r) => r.covered).length;

    const controllerCoverage: RouteCoverage.ControllerCoverage[] = [];
    for (const [basePath, stats] of controllerMap) {
      controllerCoverage.push({
        basePath,
        totalRoutes: stats.total,
        coveredRoutes: stats.covered,
        coverageRatio: stats.total > 0 ? stats.covered / stats.total : 0,
      });
    }

    return {
      totalRoutes,
      coveredRoutes,
      routeCoverageRatio: totalRoutes > 0 ? coveredRoutes / totalRoutes : 0,
      controllerCoverage,
      testedMethods,
      definedMethods,
      routeStatuses,
    };
  }

  /** Normalize a single path/action segment to lowercase */
  private static normalizeSegment(segment: string): string {
    return segment.toLowerCase();
  }

  private normalizePathSegments(pathStr: string): string[] {
    return pathStr
      .split("/")
      .filter((s) => s.length > 0 && !s.startsWith(":"))
      .map((s) => s.toLowerCase());
  }

  private segmentsMatch(
    routeSegments: string[],
    targetSegments: string[],
  ): boolean {
    // Non-wildcard segments in route must exactly equal the test segments
    // (wildcards are skipped because SDK accessors don't include path params).
    const routeFixed = routeSegments.filter((s) => s !== "*");
    if (routeFixed.length !== targetSegments.length) return false;

    let fi = 0;
    for (const seg of routeFixed) {
      if (seg !== targetSegments[fi]) return false;
      fi++;
    }
    return true;
  }

  private computeRouteBasedScore(
    analysis: RouteCoverage.AnalysisResult,
    quality: TestQuality,
    issues: Issue[],
  ): number {
    if (analysis.totalRoutes === 0) return 0;

    // 1. Route coverage (50 pts)
    const routeScore = Math.round(analysis.routeCoverageRatio * 50);

    // 2. Method diversity (15 pts)
    const methodDiversity =
      analysis.definedMethods.size > 0
        ? analysis.testedMethods.size / analysis.definedMethods.size
        : 0;
    const methodScore = Math.round(methodDiversity * 15);

    // 3. Test quality (25 pts)
    const qualityScore = Math.round(quality.qualityRatio * 25);

    // 4. Controller breadth (10 pts) — continuous scoring per controller
    // Instead of a binary 50% cliff, use each controller's actual coverage ratio.
    const avgControllerCoverage =
      analysis.controllerCoverage.length > 0
        ? analysis.controllerCoverage.reduce(
            (sum, c) => sum + c.coverageRatio,
            0,
          ) / analysis.controllerCoverage.length
        : 0;
    const breadthScore = Math.round(avgControllerCoverage * 10);

    let score = routeScore + methodScore + qualityScore + breadthScore;

    // Issues for uncovered routes (grouped by controller)
    const uncoveredRoutes = analysis.routeStatuses.filter((r) => !r.covered);
    if (uncoveredRoutes.length > 0) {
      const byController = new Map<string, string[]>();
      for (const status of uncoveredRoutes) {
        const ctrl = status.route.controller;
        const list = byController.get(ctrl) ?? [];
        list.push(`${status.route.method} ${status.route.fullPath}`);
        byController.set(ctrl, list);
      }

      for (const [controller, endpoints] of byController) {
        const preview = endpoints.slice(0, 3).join(", ");
        const more =
          endpoints.length > 3 ? ` (+${endpoints.length - 3} more)` : "";
        issues.push(
          createIssue({
            severity: "warning",
            category: "test",
            code: "TEST005",
            message: `Controller "${controller}" has ${endpoints.length} untested route(s): ${preview}${more}`,
          }),
        );
      }
    }

    // Issue for poor method diversity
    const untestedMethods = [...analysis.definedMethods].filter(
      (m) => !analysis.testedMethods.has(m),
    );
    if (untestedMethods.length > 0) {
      issues.push(
        createIssue({
          severity: "suggestion",
          category: "test",
          code: "TEST006",
          message: `HTTP method(s) not covered by any test: ${untestedMethods.join(", ")}`,
        }),
      );
    }

    // Zero route coverage
    if (analysis.coveredRoutes === 0 && analysis.totalRoutes > 0) {
      issues.push(
        createIssue({
          severity: "critical",
          category: "test",
          code: "TEST007",
          message: `No routes are covered by tests (0/${analysis.totalRoutes} routes)`,
        }),
      );
      score = 0;
    }

    return Math.min(100, Math.max(0, score));
  }

  // ── Test quality analysis (unchanged) ─────────────────

  private analyzeTestQuality(
    testFiles: string[],
    issues: Issue[],
  ): TestQuality {
    let stubCount = 0;
    let withAssertions = 0;

    for (const filePath of testFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");

        const hasAssertions =
          /\b(expect|assert|should|toBe|toEqual|toThrow|toHaveBeenCalled|strictEqual)\s*\(/i.test(
            content,
          );

        const hasTestStructure =
          /\b(describe|it|test|beforeAll|beforeEach|afterAll|afterEach)\s*\(/i.test(
            content,
          );

        // A file is a stub only if it lacks real assertions AND has placeholder markers
        const hasPlaceholder =
          /(?:throw new Error\(["']not implemented["']\)|pending\(\)|skip\()/i.test(
            content,
          );
        const isStub =
          !hasAssertions &&
          !hasTestStructure &&
          (hasPlaceholder || content.length < 100);

        if ((hasAssertions || hasTestStructure) && !isStub) {
          withAssertions++;
        } else {
          stubCount++;
        }
      } catch {
        stubCount++;
      }
    }

    const total = testFiles.length || 1;
    const qualityRatio = withAssertions / total;

    if (stubCount > 0) {
      issues.push(
        createIssue({
          severity: "warning",
          category: "test",
          code: "TEST003",
          message: `${stubCount}/${total} test files are stubs or lack assertions`,
        }),
      );
    }

    return { stubCount, withAssertions, qualityRatio };
  }

  // ── Fallback: naive scoring (kept for no-route projects) ──

  private computeCoverageScore(
    testCount: number,
    controllerCount: number,
    coverageRatio: number,
    quality: TestQuality,
    issues: Issue[],
  ): number {
    if (testCount === 0) {
      issues.push(
        createIssue({
          severity: "critical",
          category: "test",
          code: "TEST001",
          message: "No test files found",
        }),
      );
      return 0;
    }

    let score = Math.round(coverageRatio * 40);

    if (testCount >= controllerCount * 3) {
      score += 30;
    } else if (testCount >= controllerCount * 2) {
      score += 20;
    } else if (testCount >= controllerCount) {
      score += 10;
    }

    score += Math.round(quality.qualityRatio * 30);

    if (testCount < controllerCount) {
      issues.push(
        createIssue({
          severity: "warning",
          category: "test",
          code: "TEST002",
          message: `Only ${testCount} tests for ${controllerCount} controllers`,
        }),
      );
    }

    // Apply mild discount (0.9x) for fallback mode since route-level analysis
    // is unavailable, but don't hard-cap at 80 which unfairly penalizes models.
    return Math.min(100, Math.round(score * 0.9));
  }

  // ── Runtime evaluation (unchanged) ────────────────────

  private evaluateFromRuntime(
    testResults: RuntimeTestResult,
    startTime: number,
  ): PhaseResult {
    const { passed, failed, total, durationMs } = testResults;
    const passRate = total > 0 ? passed / total : 0;
    const score = Math.round(passRate * 100);
    const issues: Issue[] = [];

    if (failed > 0) {
      issues.push(
        createIssue({
          severity: "warning",
          category: "test",
          code: "TEST004",
          message: `${failed}/${total} e2e tests failed`,
        }),
      );
    }

    return {
      phase: "testCoverage",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * PHASE_WEIGHTS.testCoverage,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        source: "runtime",
        testsPassed: passed,
        testsFailed: failed,
        testsTotal: total,
        testDurationMs: durationMs,
        passRate: Math.round(passRate * 100),
      },
    };
  }
}
