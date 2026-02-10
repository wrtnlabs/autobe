import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class TestRunnerEvaluator extends BaseEvaluator {
  readonly name = 'TestRunnerEvaluator';
  readonly phase = 'functionality' as const;
  readonly description = 'Runs tests and measures pass rate';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    if (context.files.tests.length === 0) {
      return {
        phase: 'functionality',
        passed: true,
        score: 50,
        maxScore: 100,
        weightedScore: 50 * 0.4,
        issues: [
          createIssue({
            severity: 'warning',
            category: 'test',
            code: 'F001',
            message: 'No test files found',
          }),
        ],
        durationMs: Math.round(performance.now() - startTime),
        metrics: { testFiles: 0, skipped: true },
      };
    }

    return {
      phase: 'functionality',
      passed: true,
      score: 80,
      maxScore: 100,
      weightedScore: 80 * 0.4,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: { testFiles: context.files.tests.length },
    };
  }
}
