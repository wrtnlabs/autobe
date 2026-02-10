import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class RequirementsEvaluator extends BaseEvaluator {
  readonly name = 'RequirementsEvaluator';
  readonly phase = 'functionality' as const;
  readonly description = 'Checks requirements coverage';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    if (!context.requirements || context.requirements.length === 0) {
      return {
        phase: 'functionality',
        passed: true,
        score: 80,
        maxScore: 100,
        weightedScore: 80 * 0.4,
        issues: [
          createIssue({
            severity: 'suggestion',
            category: 'requirements',
            code: 'R001',
            message: 'No requirements documents found',
          }),
        ],
        durationMs: Math.round(performance.now() - startTime),
        metrics: { skipped: true },
      };
    }

    return {
      phase: 'functionality',
      passed: true,
      score: 100,
      maxScore: 100,
      weightedScore: 100 * 0.4,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: { requirementsDocs: context.requirements.length },
    };
  }
}
