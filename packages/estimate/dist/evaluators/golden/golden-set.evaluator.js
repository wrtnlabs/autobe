"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldenSetEvaluator = void 0;
const types_1 = require("../../types");
const bbs_scenarios_1 = require("./bbs.scenarios");
const http_runner_1 = require("./http-runner");
const reddit_scenarios_1 = require("./reddit.scenarios");
const shopping_scenarios_1 = require("./shopping.scenarios");
const todo_scenarios_1 = require("./todo.scenarios");
const url_resolver_1 = require("./url-resolver");
class GoldenSetEvaluator {
    name = "GoldenSetEvaluator";
    async evaluate(context, project, port) {
        const startTime = performance.now();
        const issues = [];
        const routes = (0, url_resolver_1.buildRouteMap)(context.project.rootPath);
        if (routes.length === 0) {
            return {
                phase: "goldenSet",
                passed: false,
                score: 0,
                maxScore: 100,
                weightedScore: 0,
                issues: [
                    (0, types_1.createIssue)({
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
        const http = new http_runner_1.HttpRunner(port);
        let results;
        switch (project) {
            case "todo":
                results = await (0, todo_scenarios_1.runTodoScenarios)(routes, http);
                break;
            case "bbs":
                results = await (0, bbs_scenarios_1.runBbsScenarios)(routes, http);
                break;
            case "reddit":
                results = await (0, reddit_scenarios_1.runRedditScenarios)(routes, http);
                break;
            case "shopping":
                results = await (0, shopping_scenarios_1.runShoppingScenarios)(routes, http);
                break;
        }
        const total = results.length;
        const passed = results.filter((r) => r.passed).length;
        const score = Math.round((passed / total) * 100);
        for (const result of results) {
            if (!result.passed) {
                issues.push((0, types_1.createIssue)({
                    severity: "critical",
                    category: "runtime",
                    code: "GS002",
                    message: `[FAIL] ${result.name}: ${result.reason ?? "unknown"}`,
                }));
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
exports.GoldenSetEvaluator = GoldenSetEvaluator;
//# sourceMappingURL=golden-set.evaluator.js.map