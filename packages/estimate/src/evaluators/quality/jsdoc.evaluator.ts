import * as ts from 'typescript';
import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class JsDocEvaluator extends BaseEvaluator {
  readonly name = 'JsDocEvaluator';
  readonly phase = 'quality' as const;
  readonly description = 'Checks for JSDoc comments';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();
    let totalPublicApis = 0;
    let documentedApis = 0;

    // Only check controllers and structures (public APIs)
    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.structures,
    ];

    for (const filePath of filesToCheck) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = this.analyzeFile(filePath, content);
        issues.push(...result.issues);
        totalPublicApis += result.totalApis;
        documentedApis += result.documentedApis;
      } catch {
        // Skip
      }
    }

    // Calculate coverage-based score instead of issue-based
    const coverage = totalPublicApis > 0 ? (documentedApis / totalPublicApis) * 100 : 100;
    const score = Math.round(coverage);

    return {
      phase: 'quality',
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

  private analyzeFile(filePath: string, content: string): { issues: Issue[]; totalApis: number; documentedApis: number } {
    const issues: Issue[] = [];
    let totalApis = 0;
    let documentedApis = 0;

    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node) => {
      // Only check class declarations (not every method)
      if (ts.isClassDeclaration(node) && node.name) {
        totalApis++;
        if (this.hasJsDoc(node, sourceFile)) {
          documentedApis++;
        } else {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push(
            createIssue({
              severity: 'suggestion',
              category: 'jsdoc',
              code: 'J001',
              message: `Class "${node.name.text}" missing JSDoc`,
              location: { file: filePath, line: line + 1 },
            })
          );
        }
      }

      // Check interfaces (DTOs)
      if (ts.isInterfaceDeclaration(node) && node.name) {
        totalApis++;
        if (this.hasJsDoc(node, sourceFile)) {
          documentedApis++;
        } else {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push(
            createIssue({
              severity: 'suggestion',
              category: 'jsdoc',
              code: 'J002',
              message: `Interface "${node.name.text}" missing JSDoc`,
              location: { file: filePath, line: line + 1 },
            })
          );
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return { issues, totalApis, documentedApis };
  }

  private hasJsDoc(node: ts.Node, sourceFile: ts.SourceFile): boolean {
    const text = sourceFile.getFullText();
    const nodeStart = node.getFullStart();
    const leadingComments = ts.getLeadingCommentRanges(text, nodeStart);

    if (!leadingComments) return false;
    return leadingComments.some(comment => {
      const commentText = text.slice(comment.pos, comment.end);
      return commentText.startsWith('/**');
    });
  }
}
