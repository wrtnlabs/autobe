import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { runBbsScenarios } from "./bbs.scenarios";
import { runGauzyScenarios } from "./gauzy.scenarios";
import { HttpRunner } from "./http-runner";
import { runRedditScenarios } from "./reddit.scenarios";
import type { ScenarioResult } from "./scenario-helpers";
import { runShoppingScenarios } from "./shopping.scenarios";
import { runTodoScenarios } from "./todo.scenarios";
import { buildRouteMap } from "./url-resolver";

export type GoldenProject = "todo" | "bbs" | "reddit" | "shopping" | "gauzy";

export class GoldenSetEvaluator {
  readonly name = "GoldenSetEvaluator";

  private aggregateTimings(
    results: ScenarioResult[],
  ): Record<string, number> {
    const timings = results
      .map((r) => r.durationMs)
      .filter((d): d is number => d !== undefined);
    if (timings.length === 0) return {};
    const sorted = [...timings].sort((a, b) => a - b);
    return {
      avgResponseMs: Math.round(
        timings.reduce((a, b) => a + b, 0) / timings.length,
      ),
      p50ResponseMs: sorted[Math.floor(sorted.length * 0.5)],
      p95ResponseMs: sorted[Math.floor(sorted.length * 0.95)],
      maxResponseMs: sorted[sorted.length - 1],
    };
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

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const score = Math.round((passed / total) * 100);

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
      // Report schema validation warnings (non-blocking)
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
      weightedScore: score,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalFeatures: total,
        passedFeatures: passed,
        failedFeatures: total - passed,
        ...this.aggregateTimings(results),
      },
    };
  }
}
