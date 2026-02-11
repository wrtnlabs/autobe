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

    const docsPath = path.join(context.project.rootPath, 'docs', 'analysis');
    const readmePath = path.join(context.project.rootPath, 'README.md');

    const hasDocsFolder = fs.existsSync(docsPath);
    const hasReadme = fs.existsSync(readmePath);

    let docFiles: string[] = [];
    let totalDocLength = 0;

    // Read docs and README in parallel
    const [docsResult, readmeResult] = await Promise.all([
      this.readDocsFolder(docsPath, hasDocsFolder),
      this.readReadme(readmePath, hasReadme),
    ]);

    docFiles = docsResult.files;
    totalDocLength = docsResult.totalLength + readmeResult.length;

    // Calculate score
    let score = 0;

    if (!hasDocsFolder && !hasReadme) {
      score = 0;
      issues.push(createIssue({
        severity: 'critical',
        category: 'documentation',
        code: 'DOC001',
        message: 'No documentation found (missing docs/analysis/ and README.md)',
      }));
    } else {
      if (hasDocsFolder) score += 40;
      if (hasReadme) score += 20;
      
      if (docFiles.length >= 5) score += 20;
      else if (docFiles.length >= 3) score += 15;
      else if (docFiles.length >= 1) score += 10;

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

  private async readDocsFolder(docsPath: string, exists: boolean): Promise<{ files: string[]; totalLength: number }> {
    if (!exists) return { files: [], totalLength: 0 };

    try {
      const allFiles = await fs.promises.readdir(docsPath);
      const docFiles = allFiles.filter(f => f.endsWith('.md') || f.endsWith('.json'));

      const contents = await Promise.all(
        docFiles.map(async (file) => {
          try {
            return await fs.promises.readFile(path.join(docsPath, file), 'utf-8');
          } catch {
            return '';
          }
        })
      );

      const totalLength = contents.reduce((sum, c) => sum + c.length, 0);
      return { files: docFiles, totalLength };
    } catch {
      return { files: [], totalLength: 0 };
    }
  }

  private async readReadme(readmePath: string, exists: boolean): Promise<{ length: number }> {
    if (!exists) return { length: 0 };

    try {
      const content = await fs.promises.readFile(readmePath, 'utf-8');
      return { length: content.length };
    } catch {
      return { length: 0 };
    }
  }
}
