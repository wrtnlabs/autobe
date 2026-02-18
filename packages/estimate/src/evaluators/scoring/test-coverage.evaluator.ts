import * as path from 'path';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class TestCoverageEvaluator extends BaseEvaluator {
  readonly name = 'TestCoverageEvaluator';
  readonly phase = 'testCoverage' as const;
  readonly description = 'Evaluates test coverage';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    const testCount = context.files.tests.length;
    const controllerCount = context.files.controllers.length;
    const providerCount = context.files.providers.length;

    // Calculate expected tests (at least 1 test per controller)
    const expectedMinTests = controllerCount;
    
    // Calculate coverage ratio
    const coverageRatio = expectedMinTests > 0 
      ? Math.min(testCount / expectedMinTests, 1) 
      : (testCount > 0 ? 1 : 0);

    const score = this.computeCoverageScore(testCount, controllerCount, coverageRatio, issues);

    // Extract controller names and check which have tests
    const controllerNames = context.files.controllers.map(f => {
      const basename = path.basename(f, '.ts');
      return basename.replace('Controller', '').toLowerCase();
    });

    const testNames = context.files.tests.map(f => {
      return path.basename(f, '.ts').toLowerCase();
    });

    let coveredControllers = 0;
    for (const ctrl of controllerNames) {
      const hasTest = testNames.some(t => t.includes(ctrl) || ctrl.includes(t.replace('test_api_', '')));
      if (hasTest) coveredControllers++;
    }

    const actualCoverage = controllerCount > 0 
      ? Math.round((coveredControllers / controllerCount) * 100) 
      : 0;

    return {
      phase: 'testCoverage',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.2,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        testCount,
        controllerCount,
        providerCount,
        coverageRatio: Math.round(coverageRatio * 100),
        actualCoverage,
      },
    };
  }

  private computeCoverageScore(
    testCount: number,
    controllerCount: number,
    coverageRatio: number,
    issues: Issue[],
  ): number {
    if (testCount === 0) {
      issues.push(createIssue({
        severity: 'critical',
        category: 'test',
        code: 'TEST001',
        message: 'No test files found',
      }));
      return 0;
    }

    // Base score from coverage ratio
    let score = Math.round(coverageRatio * 70);

    // Bonus for test count
    if (testCount >= controllerCount * 3) {
      score += 30; // Excellent: 3+ tests per controller
    } else if (testCount >= controllerCount * 2) {
      score += 20; // Good: 2+ tests per controller
    } else if (testCount >= controllerCount) {
      score += 10; // OK: 1+ test per controller
    }

    // Check for missing coverage
    if (testCount < controllerCount) {
      issues.push(createIssue({
        severity: 'warning',
        category: 'test',
        code: 'TEST002',
        message: `Only ${testCount} tests for ${controllerCount} controllers`,
      }));
    }

    return Math.min(100, score);
  }
}
