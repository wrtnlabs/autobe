import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { GateEvaluator } from '../base';
import type { EvaluationContext, Issue } from '../../types';
import { createIssue } from '../../types';

export class PrismaEvaluator extends GateEvaluator {
  readonly name = 'PrismaEvaluator';
  readonly description = 'Validates Prisma schema';

  async checkGate(context: EvaluationContext): Promise<{
    passed: boolean;
    issues: Issue[];
    metrics?: Record<string, number | string | boolean>;
  }> {
    const issues: Issue[] = [];

    // Check if prisma schema exists
    if (context.files.prismaSchemas.length === 0) {
      return {
        passed: true,
        issues: [],
        metrics: { skipped: true, reason: 'No Prisma schemas found' },
      };
    }

    const rootPath = context.project.rootPath;

    // Find prisma binary
    const prismaPath = this.findPrismaPath(rootPath);
    if (!prismaPath) {
      issues.push(
        createIssue({
          severity: 'warning',
          category: 'prisma',
          code: 'P000',
          message: 'Prisma CLI not found, skipping validation',
        })
      );
      return { passed: true, issues, metrics: { skipped: true } };
    }

    try {
      execSync(`"${prismaPath}" validate`, {
        cwd: rootPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return { passed: true, issues: [], metrics: { valid: true } };
    } catch (error) {
      const stderr = error instanceof Error && 'stderr' in error
        ? String((error as any).stderr)
        : '';
      const stdout = error instanceof Error && 'stdout' in error
        ? String((error as any).stdout)
        : '';
      
      const output = stderr || stdout || 'Unknown Prisma validation error';
      
      // Parse error message properly
      const errorMessage = this.parseErrorMessage(output);

      issues.push(
        createIssue({
          severity: 'critical',
          category: 'prisma-error',
          code: 'P001',
          message: errorMessage,
        })
      );

      return { passed: false, issues, metrics: { valid: false } };
    }
  }

  private findPrismaPath(rootPath: string): string | null {
    const localPrisma = path.join(rootPath, 'node_modules', '.bin', 'prisma');
    if (fs.existsSync(localPrisma)) {
      return localPrisma;
    }

    let currentDir = rootPath;
    for (let i = 0; i < 5; i++) {
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;

      const parentPrisma = path.join(parentDir, 'node_modules', '.bin', 'prisma');
      if (fs.existsSync(parentPrisma)) {
        return parentPrisma;
      }
      currentDir = parentDir;
    }

    return null;
  }

  private parseErrorMessage(output: string): string {
    // Clean up the output
    const lines = output.split('\n').filter(line => line.trim().length > 0);
    
    // Find the actual error message
    const errorLines: string[] = [];
    let foundError = false;
    
    for (const line of lines) {
      // Skip ANSI color codes and formatting
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim();
      
      if (cleanLine.includes('error') || cleanLine.includes('Error') || foundError) {
        foundError = true;
        if (cleanLine.length > 0) {
          errorLines.push(cleanLine);
        }
      }
    }

    if (errorLines.length > 0) {
      // Return first few lines of error (max 200 chars)
      const message = errorLines.slice(0, 3).join(' ').substring(0, 200);
      return message || 'Prisma schema validation failed';
    }

    // Fallback: return cleaned output
    const cleaned = output.replace(/\x1b\[[0-9;]*m/g, '').trim();
    return cleaned.substring(0, 200) || 'Prisma schema validation failed';
  }
}
