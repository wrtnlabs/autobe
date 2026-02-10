import * as ts from 'typescript';
import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

/**
 * Validation Evaluator
 * Checks for input validation patterns
 */
export class ValidationEvaluator extends BaseEvaluator {
  readonly name = 'ValidationEvaluator';
  readonly phase = 'safety' as const;
  readonly description = 'Checks for input validation';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    // Check controllers for validation
    for (const filePath of context.files.controllers) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileIssues = this.analyzeController(filePath, content);
        issues.push(...fileIssues);
      } catch {
        // Skip unreadable files
      }
    }

    // Check structures (DTOs) for validation decorators/types
    for (const filePath of context.files.structures) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileIssues = this.analyzeStructure(filePath, content);
        issues.push(...fileIssues);
      } catch {
        // Skip unreadable files
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
      metrics: {
        controllersChecked: context.files.controllers.length,
        structuresChecked: context.files.structures.length,
        validationIssues: issues.length,
      },
    };
  }

  private analyzeController(filePath: string, content: string): Issue[] {
    const issues: Issue[] = [];
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node: ts.Node) => {
      // Check methods with 'any' type parameters
      if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
        for (const param of node.parameters) {
          if (param.type && param.type.kind === ts.SyntaxKind.AnyKeyword) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(param.getStart());
            issues.push(
              createIssue({
                severity: 'warning',
                category: 'validation',
                code: 'V001',
                message: `Parameter "${param.name.getText()}" has 'any' type - use specific type for validation`,
                location: { file: filePath, line: line + 1 },
                suggestion: 'Define a proper DTO type for this parameter',
              })
            );
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return issues;
  }

  private analyzeStructure(filePath: string, content: string): Issue[] {
    const issues: Issue[] = [];
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node: ts.Node) => {
      // Check interfaces/types for optional fields without default
      if (ts.isInterfaceDeclaration(node)) {
        let hasOptionalWithoutDescription = false;

        for (const member of node.members) {
          if (ts.isPropertySignature(member)) {
            // Check for 'any' type in DTOs
            if (member.type && member.type.kind === ts.SyntaxKind.AnyKeyword) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(member.getStart());
              issues.push(
                createIssue({
                  severity: 'warning',
                  category: 'validation',
                  code: 'V002',
                  message: `DTO property has 'any' type - use specific type`,
                  location: { file: filePath, line: line + 1 },
                })
              );
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return issues;
  }
}
