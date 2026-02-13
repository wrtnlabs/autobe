import * as fs from 'fs';
import * as path from 'path';
import { AutoBeDatabaseCompiler } from '@autobe/compiler';
import { GateEvaluator } from '../base';
import type { EvaluationContext, Issue } from '../../types';
import { createIssue } from '../../types';

/**
 * Prisma Evaluator
 * Validates Prisma schema using AutoBeDatabaseCompiler (in-memory)
 */
export class PrismaEvaluator extends GateEvaluator {
  readonly name = 'PrismaEvaluator';
  readonly description = 'Validates Prisma schema using in-memory compiler';

  async checkGate(context: EvaluationContext): Promise<{
    passed: boolean;
    issues: Issue[];
    metrics?: Record<string, number | string | boolean>;
  }> {
    if (context.files.prismaSchemas.length === 0) {
      return {
        passed: true,
        issues: [],
        metrics: { skipped: true, reason: 'No Prisma schemas found' },
      };
    }

    // Read all prisma schema files into Record<string, string>
    const prismaFiles = await this.readFilesAsRecord(
      context.files.prismaSchemas,
      context.project.rootPath,
    );

    if (Object.keys(prismaFiles).length === 0) {
      return {
        passed: true,
        issues: [
          createIssue({
            severity: 'warning',
            category: 'prisma',
            code: 'P000',
            message: 'Failed to read Prisma schema files',
          }),
        ],
        metrics: { skipped: true },
      };
    }

    try {
      const compiler = new AutoBeDatabaseCompiler();
      const result = await compiler.compilePrismaSchemas({ files: prismaFiles });

      if (result.type === 'success') {
        return {
          passed: true,
          issues: [],
          metrics: { valid: true },
        };
      }

      // Compilation failed
      const errorMessage = 'diagnostics' in result
        ? (result as any).diagnostics
            ?.map((d: any) => d.messageText ?? d.message ?? String(d))
            .join('; ')
            .substring(0, 500)
        : 'message' in result
          ? String((result as any).message).substring(0, 500)
          : 'Prisma schema validation failed';

      return {
        passed: false,
        issues: [
          createIssue({
            severity: 'critical',
            category: 'prisma-error',
            code: 'P001',
            message: errorMessage || 'Prisma schema validation failed',
          }),
        ],
        metrics: { valid: false },
      };
    } catch (error) {
      return {
        passed: false,
        issues: [
          createIssue({
            severity: 'critical',
            category: 'prisma-error',
            code: 'P001',
            message: `Prisma compilation exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }),
        ],
        metrics: { valid: false },
      };
    }
  }

  private async readFilesAsRecord(
    filePaths: string[],
    rootPath: string,
  ): Promise<Record<string, string>> {
    const entries = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const relativePath = path.relative(rootPath, filePath);
          return [relativePath, content] as const;
        } catch {
          return null;
        }
      }),
    );
    return Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => e !== null));
  }
}
