import * as fs from "fs";
import * as ts from "typescript";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { PHASE_WEIGHTS, createIssue } from "../../types";
import { BaseEvaluator } from "../base";

export class ApiCompletenessEvaluator extends BaseEvaluator {
  readonly name = "ApiCompletenessEvaluator";
  readonly phase = "apiCompleteness" as const;
  readonly description = "Evaluates API implementation completeness";

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();

    const results = await Promise.all(
      context.files.controllers.map((filePath) => this.analyzeFile(filePath)),
    );

    const issues = results.flatMap((r) => r.issues);
    const totalEndpoints = results.reduce(
      (sum, r) => sum + r.totalEndpoints,
      0,
    );
    const emptyEndpoints = results.reduce(
      (sum, r) => sum + r.emptyEndpoints,
      0,
    );
    const implementedEndpoints = results.reduce(
      (sum, r) => sum + r.implementedEndpoints,
      0,
    );
    const stubEndpoints = results.reduce((sum, r) => sum + r.stubEndpoints, 0);
    const noProviderEndpoints = results.reduce(
      (sum, r) => sum + r.noProviderEndpoints,
      0,
    );
    const passthroughEndpoints = results.reduce(
      (sum, r) => sum + r.passthroughEndpoints,
      0,
    );

    let score = 0;

    if (totalEndpoints === 0) {
      score = 0;
      issues.push(
        createIssue({
          severity: "critical",
          category: "api",
          code: "API002",
          message: "No API endpoints found",
        }),
      );
    } else {
      // Non-empty ratio (max 40)
      const nonEmptyRatio = (totalEndpoints - emptyEndpoints) / totalEndpoints;
      score += Math.round(nonEmptyRatio * 40);

      // Implementation ratio (max 30)
      const implementationRatio = implementedEndpoints / totalEndpoints;
      score += Math.round(implementationRatio * 30);

      // Provider delegation ratio (max 30)
      const withProviderRatio =
        (totalEndpoints - noProviderEndpoints) / totalEndpoints;
      score += Math.round(withProviderRatio * 30);

      if (emptyEndpoints > 0) {
        issues.push(
          createIssue({
            severity: "warning",
            category: "api",
            code: "API003",
            message: `${emptyEndpoints} of ${totalEndpoints} endpoints are empty`,
          }),
        );
      }

      if (stubEndpoints > 0) {
        issues.push(
          createIssue({
            severity: "warning",
            category: "api",
            code: "API005",
            message: `${stubEndpoints} endpoints return stub values (empty object/array/null)`,
          }),
        );
      }

      if (noProviderEndpoints > 0) {
        issues.push(
          createIssue({
            severity: "suggestion",
            category: "api",
            code: "API006",
            message: `${noProviderEndpoints} endpoints don't delegate to a provider/service`,
          }),
        );
      }

      // Passthrough penalty: continuous from 0 (at 30%) to 20 (at 100%)
      // Replaces cliff at 50% with smooth ramp starting at 30%
      if (passthroughEndpoints > 0) {
        const passthroughRatio = passthroughEndpoints / totalEndpoints;
        if (passthroughRatio > 0.3) {
          const passthroughPenalty = Math.round(
            ((passthroughRatio - 0.3) / 0.7) * 20,
          );
          score = Math.max(0, score - passthroughPenalty);
        }
        issues.push(
          createIssue({
            severity: "warning",
            category: "api",
            code: "API007",
            message: `${passthroughEndpoints} of ${totalEndpoints} endpoints are pure passthrough (single delegation, no validation/transformation)`,
          }),
        );
      }
    }

    score = Math.min(100, Math.max(0, score));

    return {
      phase: "apiCompleteness",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * PHASE_WEIGHTS.apiCompleteness,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalEndpoints,
        emptyEndpoints,
        stubEndpoints,
        implementedEndpoints,
        noProviderEndpoints,
        passthroughEndpoints,
        completionRate:
          totalEndpoints > 0
            ? Math.round(
                ((totalEndpoints - emptyEndpoints) / totalEndpoints) * 100,
              )
            : 0,
        implementationRate:
          totalEndpoints > 0
            ? Math.round((implementedEndpoints / totalEndpoints) * 100)
            : 0,
      },
    };
  }

  private async analyzeFile(filePath: string): Promise<{
    issues: Issue[];
    totalEndpoints: number;
    emptyEndpoints: number;
    implementedEndpoints: number;
    stubEndpoints: number;
    noProviderEndpoints: number;
    passthroughEndpoints: number;
  }> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
      );

      const issues: Issue[] = [];
      let totalEndpoints = 0;
      let emptyEndpoints = 0;
      let implementedEndpoints = 0;
      let stubEndpoints = 0;
      let noProviderEndpoints = 0;
      let passthroughEndpoints = 0;

      // HTTP routing decorator names — only these indicate an API endpoint
      const HTTP_DECORATOR_NAMES = new Set([
        "Get",
        "Post",
        "Put",
        "Patch",
        "Delete",
        "All",
        "Head",
        "Options",
      ]);

      const visit = (node: ts.Node) => {
        if (ts.isMethodDeclaration(node)) {
          const decorators = ts.getDecorators(node);
          // Only count methods with HTTP routing decorators as endpoints
          const hasHttpDecorator = decorators?.some((d) => {
            const expr = d.expression;
            // @Get(), @Post(), etc.
            if (ts.isCallExpression(expr)) {
              const name = expr.expression.getText(sourceFile);
              // Handle @TypedRoute.Get, @TypedRoute.Post, etc.
              const baseName = name.includes(".")
                ? name.split(".").pop()!
                : name;
              return HTTP_DECORATOR_NAMES.has(baseName);
            }
            // @Get (without parentheses)
            if (ts.isIdentifier(expr)) {
              return HTTP_DECORATOR_NAMES.has(expr.text);
            }
            return false;
          });
          if (hasHttpDecorator) {
            totalEndpoints++;

            if (node.body) {
              const bodyText = node.body.getText(sourceFile).trim();

              if (bodyText === "{}" || bodyText.match(/^\{\s*\}$/)) {
                // Empty endpoint
                emptyEndpoints++;
                issues.push(
                  createIssue({
                    severity: "critical",
                    category: "api",
                    code: "API001",
                    message: `Empty endpoint: ${node.name?.getText(sourceFile)}`,
                    location: {
                      file: filePath,
                      line:
                        sourceFile.getLineAndCharacterOfPosition(
                          node.getStart(),
                        ).line + 1,
                    },
                  }),
                );
              } else if (this.isStubBody(bodyText)) {
                // Stub return
                stubEndpoints++;
              } else {
                // Check for real implementation — require meaningful logic,
                // not just a single delegation call
                const lines = bodyText
                  .split("\n")
                  .filter(
                    (l) => l.trim().length > 0 && !l.trim().startsWith("//"),
                  );
                const statementCount = lines.filter((l) =>
                  /[;{}]/.test(l),
                ).length;

                // Single-line passthrough: `{ return (await)? this.xxx.yyy(...); }`
                const isSinglePassthrough =
                  /^\{\s*return\s+(?:await\s+)?this\.\w+\.\w+\s*\([^)]*\)\s*;?\s*\}$/s.test(
                    bodyText,
                  );

                // Real logic requires: multiple statements, conditionals, loops,
                // variable assignments, or error handling with actual logic
                const hasConditional = /\b(if|switch|[?:])\s*\(/.test(bodyText);
                const hasLoop = /\b(for|while)\s*\(/.test(bodyText);
                const hasVariableWork = /\b(const|let|var)\s+\w+\s*=/.test(
                  bodyText,
                );
                const hasTryCatchWithLogic =
                  bodyText.includes("try") &&
                  /catch\s*\([^)]*\)\s*\{[^}]*\S/.test(bodyText);
                const hasMultipleStatements = statementCount >= 3;

                const hasRealLogic =
                  !isSinglePassthrough &&
                  (hasConditional ||
                    hasLoop ||
                    hasTryCatchWithLogic ||
                    (hasVariableWork && hasMultipleStatements) ||
                    (hasMultipleStatements && bodyText.includes("await")));

                if (isSinglePassthrough) {
                  passthroughEndpoints++;
                }

                if (hasRealLogic) {
                  implementedEndpoints++;
                }

                // Check for provider/service delegation.
                // Exclude infrastructure calls that don't count as real delegation
                const INFRA_CALL_PATTERN =
                  /this\.(logger|log|logging|config|configService|moduleRef|reflector|httpAdapter|i18n)\.\w+\s*\(/i;
                const hasNonInfraDelegation =
                  /this\.\w+\.\w+\s*\(/i.test(bodyText) &&
                  bodyText
                    .split("\n")
                    .some(
                      (line) =>
                        /this\.\w+\.\w+\s*\(/i.test(line) &&
                        !INFRA_CALL_PATTERN.test(line),
                    );
                const delegatesToProvider =
                  /this\.\w*(provider|service|repository|usecase|gateway|handler|manager|facade)/i.test(
                    bodyText,
                  ) ||
                  hasNonInfraDelegation ||
                  /return\s+.*this\.\w*(provider|service|repository)/i.test(
                    bodyText,
                  ) ||
                  /await\s+this\.\w*(provider|service|repository)/i.test(
                    bodyText,
                  );

                if (!delegatesToProvider && !hasRealLogic) {
                  noProviderEndpoints++;
                }
              }
            }
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
      return {
        issues,
        totalEndpoints,
        emptyEndpoints,
        implementedEndpoints,
        stubEndpoints,
        noProviderEndpoints,
        passthroughEndpoints,
      };
    } catch {
      return {
        issues: [],
        totalEndpoints: 0,
        emptyEndpoints: 0,
        implementedEndpoints: 0,
        stubEndpoints: 0,
        noProviderEndpoints: 0,
        passthroughEndpoints: 0,
      };
    }
  }

  /** Check if method body is a stub (returns empty/null/random) */
  private isStubBody(bodyText: string): boolean {
    // Classic stubs: return {}, return [], return null, return undefined
    if (
      /^\{\s*return\s+(?:\{\}|\[\]|null|undefined)\s*;?\s*\}$/.test(bodyText)
    ) {
      return true;
    }
    // typia.random<T>() stub: generates random data instead of real logic
    if (
      /^\{\s*return\s+typia\s*\.\s*random\s*<[^>]*>\s*\(\s*\)\s*;?\s*\}$/.test(
        bodyText,
      )
    ) {
      return true;
    }
    return false;
  }
}
