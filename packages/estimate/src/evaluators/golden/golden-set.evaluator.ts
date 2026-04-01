import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { PHASE_WEIGHTS, createIssue } from "../../types";
import { runBbsScenarios } from "./bbs.scenarios";
import { runGauzyScenarios } from "./gauzy.scenarios";
import { HttpRunner } from "./http-runner";
import { runRedditScenarios } from "./reddit.scenarios";
import type { ScenarioCategory, ScenarioResult } from "./scenario-helpers";
import { runShoppingScenarios } from "./shopping.scenarios";
import { runTodoScenarios } from "./todo.scenarios";
import { buildRouteMap } from "./url-resolver";

export type GoldenProject = "todo" | "bbs" | "reddit" | "shopping" | "gauzy";

/** Category weights for scoring (total = 1.0, excluding cleanup) */
const CATEGORY_WEIGHTS: Record<ScenarioCategory, number> = {
  auth: 0.25,
  crud: 0.35,
  query: 0.15,
  negative: 0.15,
  workflow: 0.1,
  cleanup: 0,
};

/** Proportion of final score from each dimension */
// C-3: Response time removed from scoring (environment-dependent, not code quality)
// Response time is still collected as reference metrics
const CATEGORY_SCORE_RATIO = 0.85;
const DATA_CONSISTENCY_RATIO = 0.15;

export class GoldenSetEvaluator {
  readonly name = "GoldenSetEvaluator";

  private aggregateTimings(results: ScenarioResult[]): {
    metrics: Record<string, number>;
  } {
    const timings = results
      .map((r) => r.durationMs)
      .filter((d): d is number => d !== undefined);
    if (timings.length === 0) return { metrics: {} };
    const sorted = [...timings].sort((a, b) => a - b);
    return {
      metrics: {
        avgResponseMs: Math.round(
          timings.reduce((a, b) => a + b, 0) / timings.length,
        ),
        p50ResponseMs: sorted[Math.floor(sorted.length * 0.5)],
        p95ResponseMs: sorted[Math.floor(sorted.length * 0.95)],
        maxResponseMs: sorted[sorted.length - 1],
      },
    };
  }

  /** Calculate category-weighted score (70% of total) */
  private computeCategoryScore(results: ScenarioResult[]): {
    score: number;
    categoryMetrics: Record<string, unknown>;
  } {
    const byCategory = new Map<
      ScenarioCategory,
      { passed: number; total: number }
    >();

    for (const r of results) {
      const cat = r.category ?? "crud";
      const entry = byCategory.get(cat) ?? { passed: 0, total: 0 };
      entry.total++;
      if (r.passed) entry.passed++;
      byCategory.set(cat, entry);
    }

    // H-3: Redistribute weights among present categories to ensure max=100
    // Within a single project, all models face the same categories, so
    // redistribution doesn't affect cross-model comparison
    let activeWeightSum = 0;
    for (const [cat, weight] of Object.entries(CATEGORY_WEIGHTS)) {
      if (weight > 0 && byCategory.has(cat as ScenarioCategory)) {
        activeWeightSum += weight;
      }
    }

    let score = 0;
    const categoryMetrics: Record<string, unknown> = {};

    for (const [cat, entry] of byCategory) {
      const rawWeight = CATEGORY_WEIGHTS[cat] ?? 0;
      const normalizedWeight =
        activeWeightSum > 0 ? rawWeight / activeWeightSum : 0;
      const catScore = entry.total > 0 ? (entry.passed / entry.total) * 100 : 0;
      score += catScore * normalizedWeight;
      categoryMetrics[cat] = {
        passed: entry.passed,
        total: entry.total,
        score: Math.round(catScore),
        weight: Math.round(normalizedWeight * 100),
      };
    }

    return { score, categoryMetrics };
  }

  /** Calculate data consistency score (15% of total) */
  private computeConsistencyScore(results: ScenarioResult[]): number {
    if (results.length === 0) return 100;
    const withWarnings = results.filter(
      (r) => r.schemaWarnings && r.schemaWarnings.length > 0,
    ).length;
    const warningRatio = withWarnings / results.length;
    // Gentler curve: 0% warnings → 100, 50% → 50, 100% → 0
    // (Previous: 200x multiplier made 50% warnings → 0 score)
    return Math.max(0, Math.round(100 * (1 - warningRatio)));
  }

  async evaluate(
    context: EvaluationContext,
    project: GoldenProject,
    port?: number,
  ): Promise<PhaseResult> {
    const startTime = performance.now();
    const issues: Issue[] = [];

    const routes = buildRouteMap(context.project.rootPath);

    if (routes.length === 0) {
      return {
        phase: "goldenSet",
        passed: false,
        score: 0,
        maxScore: 100,
        weightedScore: 0,
        issues: [
          createIssue({
            severity: "critical",
            category: "runtime",
            code: "GS001",
            message: "No routes found in source",
          }),
        ],
        durationMs: Math.round(performance.now() - startTime),
        metrics: { totalFeatures: 0, passedFeatures: 0 },
      };
    }

    const http = new HttpRunner(port);
    let results: ScenarioResult[];

    try {
      switch (project) {
        case "todo":
          results = await runTodoScenarios(routes, http);
          break;
        case "bbs":
          results = await runBbsScenarios(routes, http);
          break;
        case "reddit":
          results = await runRedditScenarios(routes, http);
          break;
        case "shopping":
          results = await runShoppingScenarios(routes, http);
          break;
        case "gauzy":
          results = await runGauzyScenarios(routes, http);
          break;
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        phase: "goldenSet",
        passed: false,
        score: 0,
        maxScore: 100,
        weightedScore: 0,
        issues: [
          createIssue({
            severity: "critical",
            category: "runtime",
            code: "GS004",
            message: `Scenario execution crashed: ${errMsg}`,
          }),
        ],
        durationMs: Math.round(performance.now() - startTime),
        metrics: { totalFeatures: 0, passedFeatures: 0 },
      };
    }

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;

    // Multi-dimensional scoring
    const { score: categoryScore, categoryMetrics } =
      this.computeCategoryScore(results);
    const { metrics: timingMetrics } = this.aggregateTimings(results);
    const consistencyScore = this.computeConsistencyScore(results);

    const score = Math.round(
      categoryScore * CATEGORY_SCORE_RATIO +
        consistencyScore * DATA_CONSISTENCY_RATIO,
    );

    for (const result of results) {
      if (!result.passed) {
        issues.push(
          createIssue({
            severity: "critical",
            category: "runtime",
            code: "GS002",
            message: `[FAIL] ${result.name}: ${result.reason ?? "unknown"}`,
          }),
        );
      }
      if (result.schemaWarnings && result.schemaWarnings.length > 0) {
        for (const warning of result.schemaWarnings) {
          issues.push(
            createIssue({
              severity: "warning",
              category: "runtime",
              code: "GS003",
              message: `[SCHEMA] ${result.name}: ${warning}`,
            }),
          );
        }
      }
    }

    return {
      phase: "goldenSet",
      passed: passed === total,
      score,
      maxScore: 100,
      weightedScore: score * PHASE_WEIGHTS.goldenSet,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalFeatures: total,
        passedFeatures: passed,
        failedFeatures: total - passed,
        passRate: Math.round((passed / total) * 100),
        categoryScore: Math.round(categoryScore),
        consistencyScore,
        ...timingMetrics,
        categories: JSON.stringify(categoryMetrics),
      },
    };
  }
}
