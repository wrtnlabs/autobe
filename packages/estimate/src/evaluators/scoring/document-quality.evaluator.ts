import * as fs from 'fs';
import * as path from 'path';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class DocumentQualityEvaluator extends BaseEvaluator {
  readonly name = 'DocumentQualityEvaluator';
  readonly phase = 'documentQuality' as const;
  readonly description = 'Evaluates documentation quality';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();
    let score = 0;

    const docsPath = path.join(context.project.rootPath, 'docs', 'analysis');
    const readmePath = path.join(context.project.rootPath, 'README.md');

    let hasDocsFolder = false;
    let hasReadme = false;
    let docFiles: string[] = [];
    let totalDocLength = 0;

    // Check docs/analysis folder
    if (fs.existsSync(docsPath)) {
      hasDocsFolder = true;
      try {
        const files = fs.readdirSync(docsPath);
        docFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.json'));
        
        for (const file of docFiles) {
          const content = fs.readFileSync(path.join(docsPath, file), 'utf-8');
          totalDocLength += content.length;
        }
      } catch {
        // Skip
      }
    }

    // Check README.md
    if (fs.existsSync(readmePath)) {
      hasReadme = true;
      const content = fs.readFileSync(readmePath, 'utf-8');
      totalDocLength += content.length;
    }

    // Calculate score
    if (!hasDocsFolder && !hasReadme) {
      score = 0;
      issues.push(createIssue({
        severity: 'critical',
        category: 'documentation',
        code: 'DOC001',
        message: 'No documentation found (missing docs/analysis/ and README.md)',
      }));
    } else {
      // Base score
      if (hasDocsFolder) score += 40;
      if (hasReadme) score += 20;
      
      // Document count bonus
      if (docFiles.length >= 5) score += 20;
      else if (docFiles.length >= 3) score += 15;
      else if (docFiles.length >= 1) score += 10;

      // Content length bonus (detailed docs)
      if (totalDocLength >= 50000) score += 20;
      else if (totalDocLength >= 20000) score += 15;
      else if (totalDocLength >= 5000) score += 10;
      else if (totalDocLength >= 1000) score += 5;

      score = Math.min(100, score);

      if (!hasDocsFolder) {
        issues.push(createIssue({
          severity: 'warning',
          category: 'documentation',
          code: 'DOC002',
          message: 'Missing docs/analysis/ folder',
        }));
      }

      if (!hasReadme) {
        issues.push(createIssue({
          severity: 'warning',
          category: 'documentation',
          code: 'DOC003',
          message: 'Missing README.md',
        }));
      }

      if (totalDocLength < 5000) {
        issues.push(createIssue({
          severity: 'suggestion',
          category: 'documentation',
          code: 'DOC004',
          message: 'Documentation is sparse, consider adding more details',
        }));
      }
    }

    return {
      phase: 'documentQuality',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.2,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        hasDocsFolder,
        hasReadme,
        docFileCount: docFiles.length,
        totalDocLength,
      },
    };
  }
}
