import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class SecurityEvaluator extends BaseEvaluator {
  readonly name = 'SecurityEvaluator';
  readonly phase = 'safety' as const;
  readonly description = 'Checks for security vulnerabilities';

  private readonly PATTERNS = [
    { pattern: /password\s*[=:]\s*['`][^'"`]+['"`]/gi, code: 'S001', message: 'Hardcoded password detected', severity: 'critical' as const },
    { pattern: /api[_-]?key\s*[=:]\s*['`][^'"`]+['"`]/gi, code: 'S002', message: 'Hardcoded API key detected', severity: 'critical' as const },
    { pattern: /secret\s*[=:]\s*['`][^'"`]+['"`]/gi, code: 'S003', message: 'Hardcoded secret detected', severity: 'critical' as const },
    { pattern: /\beval\s*\(/gi, code: 'S004', message: 'Use of eval() is dangerous', severity: 'critical' as const },
    { pattern: /\.innerHTML\s*=/gi, code: 'S005', message: 'innerHTML assignment may lead to XSS', severity: 'warning' as const },
  ];

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();

    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.providers,
      ...context.files.structures,
    ].filter(filePath => !this.isTestFile(filePath));

    const results = await Promise.all(
      filesToCheck.map(filePath => this.analyzeFile(filePath))
    );

    const issues = results.flatMap(r => r);
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
        filesChecked: filesToCheck.length,
        securityIssues: issues.length,
      },
    };
  }

  private async analyzeFile(filePath: string): Promise<Issue[]> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const issues: Issue[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const { pattern, code, message, severity } of this.PATTERNS) {
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            issues.push(createIssue({
              severity,
              category: 'security',
              code,
              message,
              location: { file: filePath, line: i + 1 },
            }));
          }
        }
      }

      return issues;
    } catch {
      return [];
    }
  }

  private isTestFile(filePath: string): boolean {
    return filePath.includes('/test/') ||
           filePath.includes('.test.') ||
           filePath.includes('.spec.') ||
           filePath.includes('test_');
  }
}
