import * as ts from 'typescript';
import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class IncompleteEvaluator extends BaseEvaluator {
  readonly name = 'IncompleteEvaluator';
  readonly phase = 'llmSpecific' as const;
  readonly description = 'Detects incomplete implementations';

  private readonly INCOMPLETE_PATTERNS = [
    { pattern: /throw\s+new\s+Error\s*\(\s*["']not\s*implemented["']/gi, code: 'I001', message: 'Not implemented error' },
    { pattern: /throw\s+new\s+Error\s*\(\s*["']todo["']/gi, code: 'I002', message: 'TODO error thrown' },
    { pattern: /\/\/\s*implement\s*this/gi, code: 'I003', message: 'Implement this comment' },
  ];

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    // Only check providers (business logic)
    for (const filePath of context.files.providers) {
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
      phase: 'llmSpecific',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.1,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: { incompleteCount: issues.length },
    };
  }

  private analyzeFile(filePath: string, content: string): Issue[] {
    const issues: Issue[] = [];

    for (const { pattern, code, message } of this.INCOMPLETE_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;

        issues.push(
          createIssue({
            severity: 'critical',
            category: 'incomplete',
            code,
            message,
            location: { file: filePath, line: lineNumber },
          })
        );
      }
    }

    return issues;
  }
}
