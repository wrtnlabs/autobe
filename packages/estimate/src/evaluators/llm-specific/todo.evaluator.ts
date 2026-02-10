import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class TodoEvaluator extends BaseEvaluator {
  readonly name = 'TodoEvaluator';
  readonly phase = 'llmSpecific' as const;
  readonly description = 'Detects TODO/FIXME comments';

  private readonly PATTERNS = [
    { pattern: /\/\/\s*TODO:?\s*(.*)$/gim, type: 'TODO', severity: 'warning' as const },
    { pattern: /\/\/\s*FIXME:?\s*(.*)$/gim, type: 'FIXME', severity: 'critical' as const },
    { pattern: /\/\/\s*HACK:?\s*(.*)$/gim, type: 'HACK', severity: 'warning' as const },
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
      metrics: { todoCount: issues.length },
    };
  }

  private analyzeFile(filePath: string, content: string): Issue[] {
    const issues: Issue[] = [];

    for (const { pattern, type, severity } of this.PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const comment = match[1]?.trim() || '';

        issues.push(
          createIssue({
            severity,
            category: 'todo-left',
            code: type === 'FIXME' ? 'T002' : 'T001',
            message: `${type}: ${comment.substring(0, 50)}`,
            location: { file: filePath, line: lineNumber },
          })
        );
      }
    }

    return issues;
  }
}
