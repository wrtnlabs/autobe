import * as ts from 'typescript';
import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class NamingEvaluator extends BaseEvaluator {
  readonly name = 'NamingEvaluator';
  readonly phase = 'quality' as const;
  readonly description = 'Checks naming conventions';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    // Only check non-test files (controllers, providers, structures)
    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.providers,
      ...context.files.structures,
    ];

    for (const filePath of filesToCheck) {
      // Skip test files
      if (this.isTestFile(filePath)) continue;

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
      phase: 'quality',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.3,
      issues,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  private isTestFile(filePath: string): boolean {
    return filePath.includes('/test/') || 
           filePath.includes('.test.') || 
           filePath.includes('.spec.') ||
           filePath.includes('test_');
  }

  private analyzeFile(filePath: string, content: string): Issue[] {
    const issues: Issue[] = [];
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node) => {
      // Class names should be PascalCase
      if (ts.isClassDeclaration(node) && node.name) {
        if (!this.isPascalCase(node.name.text)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push(
            createIssue({
              severity: 'warning',
              category: 'naming',
              code: 'N001',
              message: `Class "${node.name.text}" should be PascalCase`,
              location: { file: filePath, line: line + 1 },
            })
          );
        }
      }

      // Interface names should be PascalCase
      if (ts.isInterfaceDeclaration(node) && node.name) {
        if (!this.isPascalCase(node.name.text) && !node.name.text.startsWith('I')) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push(
            createIssue({
              severity: 'warning',
              category: 'naming',
              code: 'N002',
              message: `Interface "${node.name.text}" should be PascalCase`,
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

  private isPascalCase(name: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }
}
