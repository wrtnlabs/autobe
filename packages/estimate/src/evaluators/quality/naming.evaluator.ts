import * as fs from "fs";
import * as ts from "typescript";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { BaseEvaluator } from "../base";

export class NamingEvaluator extends BaseEvaluator {
  readonly name = "NamingEvaluator";
  readonly phase = "quality" as const;
  readonly description = "Checks naming conventions";

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();

    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.providers,
      ...context.files.structures,
    ].filter((filePath) => !this.isTestFile(filePath));

    const results = await Promise.all(
      filesToCheck.map((filePath) => this.analyzeFile(filePath)),
    );

    const issues = results.flatMap((r) => r);
    const score = this.calculateScore(issues);

    return {
      phase: "quality",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.3,
      issues,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  private isTestFile(filePath: string): boolean {
    return (
      filePath.includes("/test/") ||
      filePath.includes(".test.") ||
      filePath.includes(".spec.") ||
      filePath.includes("test_")
    );
  }

  private async analyzeFile(filePath: string): Promise<Issue[]> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const issues: Issue[] = [];
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
      );

      const visit = (node: ts.Node) => {
        if (ts.isClassDeclaration(node) && node.name) {
          if (!this.isPascalCase(node.name.text)) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(
              node.getStart(),
            );
            issues.push(
              createIssue({
                severity: "warning",
                category: "naming",
                code: "N001",
                message: `Class "${node.name.text}" should be PascalCase`,
                location: { file: filePath, line: line + 1 },
              }),
            );
          }
        }

        if (ts.isInterfaceDeclaration(node) && node.name) {
          if (
            !this.isPascalCase(node.name.text) &&
            !node.name.text.startsWith("I")
          ) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(
              node.getStart(),
            );
            issues.push(
              createIssue({
                severity: "warning",
                category: "naming",
                code: "N002",
                message: `Interface "${node.name.text}" should be PascalCase`,
                location: { file: filePath, line: line + 1 },
              }),
            );
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
      return issues;
    } catch {
      return [];
    }
  }

  private isPascalCase(name: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }
}
