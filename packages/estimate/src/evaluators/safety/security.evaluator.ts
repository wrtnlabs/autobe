import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class SecurityEvaluator extends BaseEvaluator {
  readonly name = 'SecurityEvaluator';
  readonly phase = 'safety' as const;
  readonly description = 'Checks for security vulnerabilities';

  private readonly PATTERNS = [
    // Hardcoded secrets - but not in test files
    { pattern: /password\s*[=:]\s*['"`][^'"`]+['"`]/gi, code: 'S001', message: 'Hardcoded password detected', severity: 'critical' as const },
    { pattern: /api[_-]?key\s*[=:]\s*['"`][^'"`]+['"`]/gi, code: 'S002', message: 'Hardcoded API key detected', severity: 'critical' as const },
    { pattern: /secret\s*[=:]\s*['"`][^'"`]+['"`]/gi, code: 'S003', message: 'Hardcoded secret detected', severity: 'critical' as const },
    // eval() - must be actual function call, not part of word like "retrieval"
    { pattern: /\beval\s*\(/gi, code: 'S004', message: 'Use of eval() is dangerous', severity: 'critical' as const },
    // innerHTML
    { pattern: /\.innerHTML\s*=/gi, code: 'S005', message: 'innerHTML assignment may lead to XSS', severity: 'warning' as const },
  ];

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    // Only check non-test files
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
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (const { pattern, code, message, severity } of this.PATTERNS) {
            pattern.lastIndex = 0; // Reset regex
            if (pattern.test(line)) {
              issues.push(
                createIssue({
                  severity,
                  category: 'security',
                  code,
                  message,
                  location: { file: filePath, line: i + 1 },
                })
              );
            }
          }
        }
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
        filesChecked: filesToCheck.length,
        securityIssues: issues.length,
      },
    };
  }

  private isTestFile(filePath: string): boolean {
    return filePath.includes('/test/') || 
           filePath.includes('.test.') || 
           filePath.includes('.spec.') ||
           filePath.includes('test_');
  }
}
