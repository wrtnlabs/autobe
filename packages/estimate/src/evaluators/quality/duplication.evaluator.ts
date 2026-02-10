import * as fs from 'fs';
import * as crypto from 'crypto';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class DuplicationEvaluator extends BaseEvaluator {
  readonly name = 'DuplicationEvaluator';
  readonly phase = 'quality' as const;
  readonly description = 'Detects duplicate code blocks';

  // Relaxed: 10 lines minimum (was 6)
  private readonly MIN_LINES = 10;
  // Minimum characters for a block to be considered
  private readonly MIN_CHARS = 100;

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    // Only check non-test files
    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.providers,
    ];

    const codeBlocks: Map<string, { file: string; line: number }[]> = new Map();

    for (const filePath of filesToCheck) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.collectBlocks(filePath, content, codeBlocks);
      } catch {
        // Skip
      }
    }

    // Find duplicates (only report once per duplicate group)
    const reportedHashes = new Set<string>();
    for (const [hash, locations] of codeBlocks) {
      if (locations.length > 1 && !reportedHashes.has(hash)) {
        reportedHashes.add(hash);
        issues.push(
          createIssue({
            severity: 'warning',
            category: 'duplication',
            code: 'D001',
            message: `Duplicate code block found in ${locations.length} locations`,
            location: locations[0],
          })
        );
      }
    }

    const score = this.calculateScore(issues);

    return {
      phase: 'quality',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.3,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        duplicateBlocks: issues.length,
        filesScanned: filesToCheck.length,
      },
    };
  }

  private collectBlocks(
    filePath: string,
    content: string,
    codeBlocks: Map<string, { file: string; line: number }[]>
  ): void {
    const lines = content.split('\n');

    for (let i = 0; i <= lines.length - this.MIN_LINES; i++) {
      const block = lines
        .slice(i, i + this.MIN_LINES)
        .map(line => line.trim())
        .filter(line => {
          // Skip empty lines, comments, imports
          return (
            line.length > 0 &&
            !line.startsWith('//') &&
            !line.startsWith('*') &&
            !line.startsWith('/*') &&
            !line.startsWith('import ') &&
            !line.startsWith('export ')
          );
        })
        .join('\n');

      // Skip if block is too short or trivial
      if (block.length < this.MIN_CHARS) continue;
      
      // Skip if block is mostly brackets/punctuation
      const codeChars = block.replace(/[{}\[\]();,\s]/g, '');
      if (codeChars.length < 30) continue;

      const hash = crypto.createHash('md5').update(block).digest('hex');

      if (!codeBlocks.has(hash)) {
        codeBlocks.set(hash, []);
      }
      codeBlocks.get(hash)!.push({ file: filePath, line: i + 1 });
    }
  }
}
