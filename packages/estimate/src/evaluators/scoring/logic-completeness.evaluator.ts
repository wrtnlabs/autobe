import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class LogicCompletenessEvaluator extends BaseEvaluator {
  readonly name = 'LogicCompletenessEvaluator';
  readonly phase = 'logicCompleteness' as const;
  readonly description = 'Checks for incomplete implementations';

  private readonly INCOMPLETE_PATTERNS = [
    { pattern: /throw\s+new\s+Error\s*\(\s*['`]not\s*implemented['"`]\s*\)/gi, code: 'LOGIC001', message: 'Unimplemented code: throw new Error("not implemented")' },
    { pattern: /\/\/\s*TODO\s*:/gi, code: 'LOGIC002', message: 'TODO comment found' },
    { pattern: /\/\/\s*FIXME\s*:/gi, code: 'LOGIC003', message: 'FIXME comment found (indicates known bug)' },
    { pattern: /\/\/\s*HACK\s*:/gi, code: 'LOGIC004', message: 'HACK comment found' },
    { pattern: /\/\/\s*implement\s*this/gi, code: 'LOGIC005', message: 'Unimplemented placeholder found' },
    { pattern: /throw\s+new\s+Error\s*\(\s*['`]TODO['"`]\s*\)/gi, code: 'LOGIC006', message: 'TODO error placeholder' },
    { pattern: /notImplemented\s*\(\s*\)/gi, code: 'LOGIC007', message: 'notImplemented() call found' },
  ];

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();

    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.providers,
    ];

    const results = await Promise.all(
      filesToCheck.map(filePath => this.analyzeFile(filePath))
    );

    const issues = results.flatMap(r => r);
    const criticalCount = issues.filter(i => i.severity === 'critical').length;

    let score: number;
    if (criticalCount === 0 && issues.length === 0) {
      score = 100;
    } else if (criticalCount === 0) {
      score = Math.max(70, 100 - issues.length * 2);
    } else if (criticalCount <= 3) {
      score = Math.max(50, 80 - criticalCount * 10);
    } else if (criticalCount <= 10) {
      score = Math.max(20, 50 - criticalCount * 3);
    } else {
      score = 0;
    }

    return {
      phase: 'logicCompleteness',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.2,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalIncomplete: issues.length,
        criticalCount,
        todoCount: issues.filter(i => i.code === 'LOGIC002').length,
        fixmeCount: issues.filter(i => i.code === 'LOGIC003').length,
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
        
        for (const { pattern, code, message } of this.INCOMPLETE_PATTERNS) {
          // init regex instance state (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex)
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            const severity = (code === 'LOGIC002') ? 'warning' : 'critical';
            issues.push(createIssue({
              severity,
              category: 'completeness',
              code,
              message,
              location: { file: filePath, line: i + 1 },
            }));
          }
        }
      }

      return issues;
    } catch (error) {
      console.error(`Failed to analyze file ${filePath}:`, error);
      return [];
    }
  }
}
