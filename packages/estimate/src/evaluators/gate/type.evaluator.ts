import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { GateEvaluator } from '../base';
import type { EvaluationContext, Issue } from '../../types';
import { createIssue } from '../../types';

/**
 * Type Evaluator
 * Runs TypeScript compiler to check type errors
 */
export class TypeEvaluator extends GateEvaluator {
  readonly name = 'TypeEvaluator';
  readonly description = 'Checks TypeScript type errors using tsc';

  async checkGate(context: EvaluationContext): Promise<{
    passed: boolean;
    issues: Issue[];
    metrics?: Record<string, number | string | boolean>;
  }> {
    const issues: Issue[] = [];
    const rootPath = context.project.rootPath;

    // Check if tsconfig.json exists
    if (!context.tsconfigPath) {
      issues.push(
        createIssue({
          severity: 'warning',
          category: 'type-error',
          code: 'T000',
          message: 'tsconfig.json not found, skipping type check',
        })
      );

      return {
        passed: true,
        issues,
        metrics: {
          skipped: true,
          reason: 'tsconfig.json not found',
        },
      };
    }

    // Find tsc binary
    const tscPath = this.findTscPath(rootPath);
    if (!tscPath) {
      issues.push(
        createIssue({
          severity: 'warning',
          category: 'type-error',
          code: 'T000',
          message: 'TypeScript compiler not found, skipping type check',
        })
      );

      return {
        passed: true,
        issues,
        metrics: {
          skipped: true,
          reason: 'tsc not found',
        },
      };
    }

    try {
      // Run tsc --noEmit
      execSync(`"${tscPath}" --noEmit`, {
        cwd: rootPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // No errors
      return {
        passed: true,
        issues: [],
        metrics: {
          typeErrorCount: 0,
        },
      };
    } catch (error) {
      // Parse tsc output
      const stdout = error instanceof Error && 'stdout' in error
        ? String((error as any).stdout)
        : '';
      const stderr = error instanceof Error && 'stderr' in error
        ? String((error as any).stderr)
        : '';
      const output = stdout + stderr;

      const parsedIssues = this.parseTscOutput(output, rootPath);
      issues.push(...parsedIssues);

      const criticalCount = issues.filter((i) => i.severity === 'critical').length;

      return {
        passed: criticalCount === 0,
        issues,
        metrics: {
          typeErrorCount: issues.length,
        },
      };
    }
  }

  private findTscPath(rootPath: string): string | null {
    // Check local node_modules
    const localTsc = path.join(rootPath, 'node_modules', '.bin', 'tsc');
    if (fs.existsSync(localTsc)) {
      return localTsc;
    }

    // Check parent directories (monorepo)
    let currentDir = rootPath;
    for (let i = 0; i < 5; i++) {
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;

      const parentTsc = path.join(parentDir, 'node_modules', '.bin', 'tsc');
      if (fs.existsSync(parentTsc)) {
        return parentTsc;
      }
      currentDir = parentDir;
    }

    return null;
  }

  private parseTscOutput(output: string, rootPath: string): Issue[] {
    const issues: Issue[] = [];
    const lines = output.split('\n');

    // Pattern: src/file.ts(10,5): error TS2322: Type 'string' is not assignable...
    const errorPattern = /^(.+)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)$/;

    for (const line of lines) {
      const match = line.match(errorPattern);

      if (match) {
        const [, filePath, lineNum, column, severity, code, message] = match;

        issues.push(
          createIssue({
            severity: severity === 'error' ? 'critical' : 'warning',
            category: 'type-error',
            code,
            message,
            location: {
              file: path.resolve(rootPath, filePath),
              line: parseInt(lineNum, 10),
              column: parseInt(column, 10),
            },
          })
        );
      }
    }

    // If no issues parsed but there was output, add a generic error
    if (issues.length === 0 && output.trim().length > 0) {
      // Filter out npm warnings
      const filteredOutput = output
        .split('\n')
        .filter(line => !line.includes('npm warn') && !line.includes('npm exec'))
        .join('\n')
        .trim();

      if (filteredOutput.length > 0) {
        issues.push(
          createIssue({
            severity: 'critical',
            category: 'type-error',
            code: 'T001',
            message: `TypeScript compilation failed: ${filteredOutput.slice(0, 500)}`,
          })
        );
      }
    }

    return issues;
  }
}
