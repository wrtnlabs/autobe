import * as ts from 'typescript';
import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class ErrorHandlingEvaluator extends BaseEvaluator {
  readonly name = 'ErrorHandlingEvaluator';
  readonly phase = 'safety' as const;
  readonly description = 'Checks for proper error handling';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    // Only check non-test files
    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.providers,
    ];

    for (const filePath of filesToCheck) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileIssues = this.analyzeFile(filePath, content);
        issues.push(...fileIssues);
      } catch {
        // Skip
      }
    }

    const score = this.calculateScore(issues);

    return {
      phase: 'safety',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.2,
      issues,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  private analyzeFile(filePath: string, content: string): Issue[] {
    const issues: Issue[] = [];
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node) => {
      // Check for empty catch blocks
      if (ts.isCatchClause(node)) {
        if (node.block.statements.length === 0) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push(
            createIssue({
              severity: 'warning',
              category: 'error-handling',
              code: 'E001',
              message: 'Empty catch block',
              location: { file: filePath, line: line + 1 },
            })
          );
        }
      }

      // Check Promise without catch
      if (ts.isCallExpression(node)) {
        const text = node.getText(sourceFile);
        if (text.includes('.then(') && !text.includes('.catch(')) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push(
            createIssue({
              severity: 'warning',
              category: 'error-handling',
              code: 'E002',
              message: 'Promise without .catch()',
              location: { file: filePath, line: line + 1 },
            })
          );
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return issues;
  }
}
