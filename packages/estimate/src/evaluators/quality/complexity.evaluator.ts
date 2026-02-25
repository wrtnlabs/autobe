import * as fs from "fs";
import * as ts from "typescript";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { BaseEvaluator } from "../base";

export class ComplexityEvaluator extends BaseEvaluator {
  readonly name = "ComplexityEvaluator";
  readonly phase = "quality" as const;
  readonly description = "Checks cyclomatic complexity of functions";

  private readonly MAX_COMPLEXITY = 20;
  private readonly WARNING_COMPLEXITY = 15;

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();

    const results = await Promise.all(
      context.files.typescript.map((filePath) => this.analyzeFile(filePath)),
    );

    const issues = results.flatMap((r) => r.issues);
    const maxComplexity = Math.max(0, ...results.map((r) => r.maxComplexity));
    const totalFunctions = results.reduce((sum, r) => sum + r.functionCount, 0);
    const complexFunctions = issues.filter(
      (i) => i.severity === "critical",
    ).length;

    return {
      phase: "quality",
      passed: true,
      score: this.calculateScore(issues),
      maxScore: 100,
      weightedScore: this.calculateScore(issues) * 0.3,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalFunctions,
        complexFunctions,
        maxComplexity,
        maxComplexityThreshold: this.MAX_COMPLEXITY,
      },
    };
  }

  private async analyzeFile(filePath: string): Promise<{
    issues: Issue[];
    maxComplexity: number;
    functionCount: number;
  }> {
    let content: string;
    try {
      content = await fs.promises.readFile(filePath, "utf-8");
    } catch {
      return { issues: [], maxComplexity: 0, functionCount: 0 };
    }

    const issues: Issue[] = [];
    let maxComplexity = 0;

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
    );

    const visit = (node: ts.Node) => {
      const isFunction =
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node);

      if (!isFunction) {
        ts.forEachChild(node, visit);
        return;
      }

      const complexity = this.calculateComplexity(node);
      const name = this.getFunctionName(node);
      const { line } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(),
      );

      if (complexity > maxComplexity) maxComplexity = complexity;

      if (complexity > this.MAX_COMPLEXITY) {
        issues.push(
          createIssue({
            severity: "critical",
            category: "complexity",
            code: "C001",
            message: `Function "${name}" has complexity ${complexity} (max: ${this.MAX_COMPLEXITY})`,
            location: { file: filePath, line: line + 1 },
            suggestion:
              "Consider breaking this function into smaller functions",
          }),
        );
      } else if (complexity > this.WARNING_COMPLEXITY) {
        issues.push(
          createIssue({
            severity: "warning",
            category: "complexity",
            code: "C002",
            message: `Function "${name}" has complexity ${complexity} (recommended: ${this.WARNING_COMPLEXITY})`,
            location: { file: filePath, line: line + 1 },
            suggestion: "Consider simplifying this function",
          }),
        );
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return {
      issues,
      maxComplexity,
      functionCount: this.countFunctions(content),
    };
  }

  private calculateComplexity(node: ts.Node): number {
    let complexity = 1;
    const visit = (child: ts.Node) => {
      switch (child.kind) {
        case ts.SyntaxKind.IfStatement:
        case ts.SyntaxKind.ConditionalExpression:
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.DoStatement:
        case ts.SyntaxKind.CatchClause:
        case ts.SyntaxKind.CaseClause:
        case ts.SyntaxKind.BarBarToken:
        case ts.SyntaxKind.AmpersandAmpersandToken:
        case ts.SyntaxKind.QuestionQuestionToken:
          complexity++;
          break;
      }
      ts.forEachChild(child, visit);
    };
    ts.forEachChild(node, visit);
    return complexity;
  }

  private getFunctionName(node: ts.Node): string {
    if (ts.isFunctionDeclaration(node) && node.name) return node.name.text;
    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name))
      return node.name.text;
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name))
        return parent.name.text;
      if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name))
        return parent.name.text;
    }
    return "<anonymous>";
  }

  private countFunctions(content: string): number {
    const sourceFile = ts.createSourceFile(
      "temp.ts",
      content,
      ts.ScriptTarget.Latest,
      true,
    );
    let count = 0;
    const visit = (node: ts.Node) => {
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
      )
        count++;
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return count;
  }
}
