import * as fs from 'fs';
import * as path from 'path';
import { AutoBeTypeScriptCompiler } from '@autobe/compiler';
import type { IAutoBeTypeScriptCompileResult } from '@autobe/interface';
import { GateEvaluator } from '../base';
import type { EvaluationContext, Issue } from '../../types';
import { createIssue } from '../../types';

/**
 * Type Evaluator
 * Checks TypeScript type errors using AutoBeTypeScriptCompiler (in-memory)
 */
export class TypeEvaluator extends GateEvaluator {
  readonly name = 'TypeEvaluator';
  readonly description = 'Checks TypeScript type errors using in-memory compiler';

  async checkGate(context: EvaluationContext): Promise<{
    passed: boolean;
    issues: Issue[];
    metrics?: Record<string, number | string | boolean>;
  }> {
    if (context.files.typescript.length === 0) {
      return {
        passed: true,
        issues: [],
        metrics: { skipped: true, reason: 'No TypeScript files found' },
      };
    }

    // Read all TypeScript files into Record<string, string>
    const tsFiles = await this.readFilesAsRecord([
      ...context.files.controllers,
      ...context.files.providers,
      ...context.files.structures,
      ...context.files.tests,
    ], context.project.rootPath);

    // Read Prisma schema files if available
    const prismaFiles = context.files.prismaSchemas.length > 0
      ? await this.readFilesAsRecord(context.files.prismaSchemas, context.project.rootPath)
      : undefined;

    try {
      const compiler = new AutoBeTypeScriptCompiler();
      const result = await compiler.compile({
        files: tsFiles,
        prisma: prismaFiles,
      });

      return this.mapCompileResult(result);
    } catch (error) {
      return {
        passed: false,
        issues: [
          createIssue({
            severity: 'critical',
            category: 'type-error',
            code: 'T001',
            message: `TypeScript compilation exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }),
        ],
        metrics: { typeErrorCount: 1 },
      };
    }
  }

  private mapCompileResult(result: IAutoBeTypeScriptCompileResult): {
    passed: boolean;
    issues: Issue[];
    metrics?: Record<string, number | string | boolean>;
  } {
    if (result.type === 'success') {
      return {
        passed: true,
        issues: [],
        metrics: { typeErrorCount: 0 },
      };
    }

    if (result.type === 'exception') {
      return {
        passed: false,
        issues: [
          createIssue({
            severity: 'critical',
            category: 'type-error',
            code: 'T001',
            message: `TypeScript compilation exception: ${String(result.error)}`,
          }),
        ],
        metrics: { typeErrorCount: 1 },
      };
    }

    // type === 'failure'
    const issues: Issue[] = result.diagnostics.map((diag) =>
      createIssue({
        severity: diag.category === 'error' ? 'critical' : 'warning',
        category: 'type-error',
        code: `TS${diag.code}`,
        message: diag.messageText,
        location: diag.file
          ? { file: diag.file, line: diag.start ?? 0 }
          : undefined,
      }),
    );

    const criticalCount = issues.filter((i) => i.severity === 'critical').length;

    return {
      passed: criticalCount === 0,
      issues,
      metrics: { typeErrorCount: issues.length },
    };
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
