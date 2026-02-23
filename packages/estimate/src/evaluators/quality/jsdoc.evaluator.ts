import * as fs from "fs";
import * as ts from "typescript";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { BaseEvaluator } from "../base";

export class JsDocEvaluator extends BaseEvaluator {
  readonly name = "JsDocEvaluator";
  readonly phase = "quality" as const;
  readonly description = "Checks for JSDoc comments";

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();

    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.structures,
    ];

    const results = await Promise.all(
      filesToCheck.map((filePath) => this.analyzeFile(filePath)),
    );

    const issues = results.flatMap((r) => r.issues);
    const totalPublicApis = results.reduce((sum, r) => sum + r.totalApis, 0);
    const documentedApis = results.reduce(
      (sum, r) => sum + r.documentedApis,
      0,
    );

    const coverage =
      totalPublicApis > 0 ? (documentedApis / totalPublicApis) * 100 : 100;
    const score = Math.round(coverage);

    return {
      phase: "quality",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.3,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalPublicApis,
        documentedApis,
        coverage: Math.round(coverage),
      },
    };
  }

  private async analyzeFile(
    filePath: string,
  ): Promise<{ issues: Issue[]; totalApis: number; documentedApis: number }> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const issues: Issue[] = [];
      let totalApis = 0;
      let documentedApis = 0;

      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
      );

      const visit = (node: ts.Node) => {
        if (ts.isClassDeclaration(node) && node.name) {
          totalApis++;
          if (this.hasJsDoc(node, sourceFile)) {
            documentedApis++;
          } else {
            const { line } = sourceFile.getLineAndCharacterOfPosition(
              node.getStart(),
            );
            issues.push(
              createIssue({
                severity: "suggestion",
                category: "jsdoc",
                code: "J001",
                message: `Class "${node.name.text}" missing JSDoc`,
                location: { file: filePath, line: line + 1 },
              }),
            );
          }
        }

        if (ts.isInterfaceDeclaration(node) && node.name) {
          totalApis++;
          if (this.hasJsDoc(node, sourceFile)) {
            documentedApis++;
          } else {
            const { line } = sourceFile.getLineAndCharacterOfPosition(
              node.getStart(),
            );
            issues.push(
              createIssue({
                severity: "suggestion",
                category: "jsdoc",
                code: "J002",
                message: `Interface "${node.name.text}" missing JSDoc`,
                location: { file: filePath, line: line + 1 },
              }),
            );
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
      return { issues, totalApis, documentedApis };
    } catch {
      return { issues: [], totalApis: 0, documentedApis: 0 };
    }
  }

  private hasJsDoc(node: ts.Node, sourceFile: ts.SourceFile): boolean {
    const text = sourceFile.getFullText();
    const nodeStart = node.getFullStart();
    const leadingComments = ts.getLeadingCommentRanges(text, nodeStart);

    if (!leadingComments) return false;
    return leadingComments.some((comment) => {
      const commentText = text.slice(comment.pos, comment.end);
      return commentText.startsWith("/**");
    });
  }
}
