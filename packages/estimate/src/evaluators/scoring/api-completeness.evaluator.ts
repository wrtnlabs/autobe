import * as fs from "fs";
import * as ts from "typescript";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
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
    }

    score = Math.min(100, Math.max(0, score));

    return {
      phase: "apiCompleteness",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.15,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalEndpoints,
        emptyEndpoints,
        stubEndpoints,
        implementedEndpoints,
        noProviderEndpoints,
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

      const visit = (node: ts.Node) => {
        if (ts.isMethodDeclaration(node)) {
          const decorators = ts.getDecorators(node);
          if (decorators && decorators.length > 0) {
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
                // Check for real implementation
                const hasRealLogic =
                  bodyText.includes("await") ||
                  (bodyText.includes("this.") && bodyText.includes("(")) ||
                  bodyText.includes("try");

                if (hasRealLogic) {
                  implementedEndpoints++;
                }

                // Check for provider/service delegation
                const delegatesToProvider =
                  /this\.\w*(provider|service|repository|usecase)/i.test(
                    bodyText,
                  ) || /this\.\w+\.\w+\s*\(/i.test(bodyText);

                if (!delegatesToProvider) {
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
      };
    } catch {
      return {
        issues: [],
        totalEndpoints: 0,
        emptyEndpoints: 0,
        implementedEndpoints: 0,
        stubEndpoints: 0,
        noProviderEndpoints: 0,
      };
    }
  }

  /** Check if method body is a stub (returns empty/null) */
  private isStubBody(bodyText: string): boolean {
    return /^\{\s*return\s+(?:\{\}|\[\]|null|undefined)\s*;?\s*\}$/.test(
      bodyText,
    );
  }
}
