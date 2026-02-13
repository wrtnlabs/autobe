import * as fs from 'fs';
import * as path from 'path';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class RequirementsCoverageEvaluator extends BaseEvaluator {
  readonly name = 'RequirementsCoverageEvaluator';
  readonly phase = 'requirementsCoverage' as const;
  readonly description = 'Evaluates requirements to implementation coverage';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    // Count controllers (each controller = 1 feature)
    const controllerCount = context.files.controllers.length;
    
    // Count providers (business logic)
    const providerCount = context.files.providers.length;
    
    // Count structures (DTOs)
    const structureCount = context.files.structures.length;

    // Check if docs/analysis exists and has content
    const docsPath = path.join(context.project.rootPath, 'docs', 'analysis');
    let hasRequirementsDocs = false;
    let requirementsDocCount = 0;

    if (fs.existsSync(docsPath)) {
      try {
        const files = fs.readdirSync(docsPath);
        requirementsDocCount = files.filter(f => f.endsWith('.md') || f.endsWith('.json')).length;
        hasRequirementsDocs = requirementsDocCount > 0;
      } catch {
        // Skip
      }
    }

    // Calculate coverage score
    const score = this.computeRequirementsScore({
      controllerCount,
      providerCount,
      structureCount,
      hasRequirementsDocs,
    }, issues);

    return {
      phase: 'requirementsCoverage',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.25,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        controllerCount,
        providerCount,
        structureCount,
        requirementsDocCount,
        hasRequirementsDocs,
      },
    };
  }

  private computeRequirementsScore(
    counts: {
      controllerCount: number;
      providerCount: number;
      structureCount: number;
      hasRequirementsDocs: boolean;
    },
    issues: Issue[],
  ): number {
    let score = 0;

    // Controllers exist (API endpoints defined)
    if (counts.controllerCount > 0) {
      score += 30;
    } else {
      issues.push(createIssue({
        severity: 'critical',
        category: 'requirements',
        code: 'REQ001',
        message: 'No controllers found - API endpoints not implemented',
      }));
    }

    // Providers exist (business logic implemented)
    if (counts.providerCount > 0) {
      score += 30;

      // Check controller to provider ratio
      const ratio = counts.providerCount / Math.max(counts.controllerCount, 1);
      if (ratio >= 2) {
        score += 10; // Good: multiple providers per controller
      }
    } else {
      issues.push(createIssue({
        severity: 'critical',
        category: 'requirements',
        code: 'REQ002',
        message: 'No providers found - business logic not implemented',
      }));
    }

    // Structures exist (data models defined)
    if (counts.structureCount > 0) {
      score += 20;
    } else {
      issues.push(createIssue({
        severity: 'warning',
        category: 'requirements',
        code: 'REQ003',
        message: 'No structures/DTOs found',
      }));
    }

    // Requirements docs exist
    if (counts.hasRequirementsDocs) {
      score += 10;
    } else {
      issues.push(createIssue({
        severity: 'warning',
        category: 'requirements',
        code: 'REQ004',
        message: 'No requirements documents found in docs/analysis/',
      }));
    }

    return Math.min(100, score);
  }
}
