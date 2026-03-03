import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { runBbsScenarios } from "./bbs.scenarios";
import { HttpRunner } from "./http-runner";
import { runRedditScenarios } from "./reddit.scenarios";
import { runShoppingScenarios } from "./shopping.scenarios";
import { type ScenarioResult, runTodoScenarios } from "./todo.scenarios";
import { buildRouteMap } from "./url-resolver";

export type GoldenProject = "todo" | "bbs" | "reddit" | "shopping";

export class GoldenSetEvaluator {
  readonly name = "GoldenSetEvaluator";

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
      },
    };
  }
}
