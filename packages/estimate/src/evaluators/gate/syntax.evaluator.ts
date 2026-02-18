import * as ts from 'typescript';
import * as fs from 'fs';
import { GateEvaluator } from '../base';
import type { EvaluationContext, Issue } from '../../types';
import { createIssue } from '../../types';

/**
 * Syntax Evaluator
 * Checks TypeScript syntax errors using the compiler API
 */
export class SyntaxEvaluator extends GateEvaluator {
  readonly name = 'SyntaxEvaluator';
  readonly description = 'Checks TypeScript syntax errors';

  async checkGate(context: EvaluationContext): Promise<{
    passed: boolean;
    issues: Issue[];
    metrics?: Record<string, number | string | boolean>;
  }> {
    // Process all files in parallel
    const results = await Promise.all(
      context.files.typescript.map(filePath => this.checkFile(filePath))
    );

    const issues = results.flatMap(r => r.issues);
    const filesWithErrors = results.filter(r => r.hasError).length;

    return {
      passed: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      metrics: {
        totalFiles: context.files.typescript.length,
        filesWithErrors,
        syntaxErrorCount: issues.length,
      },
    };
  }

  private async checkFile(filePath: string): Promise<{ issues: Issue[]; hasError: boolean }> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const issues = this.checkSyntax(filePath, content);
      return { issues, hasError: issues.length > 0 };
    } catch (error) {
      return {
        issues: [
          createIssue({
            severity: 'critical',
            category: 'syntax-error',
            code: 'E001',
            message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            location: { file: filePath, line: 1 },
            autoFixable: false,
          }),
        ],
        hasError: true,
      };
    }
  }

  private checkSyntax(filePath: string, content: string): Issue[] {
    const issues: Issue[] = [];

    // Create a source file
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    // Get syntax diagnostics only (not semantic)
    const diagnostics = this.getSyntaxDiagnostics(sourceFile);

    for (const diagnostic of diagnostics) {
      const { line, character } = diagnostic.file
        ? ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start || 0)
        : { line: 0, character: 0 };

      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

      issues.push(
        createIssue({
          severity: 'critical',
          category: 'syntax-error',
          code: `TS${diagnostic.code}`,
          message,
          location: {
            file: filePath,
            line: line + 1,
            column: character + 1,
          },
          autoFixable: false,
        })
      );
    }

    return issues;
  }

  private getSyntaxDiagnostics(sourceFile: ts.SourceFile): ts.Diagnostic[] {
    const compilerHost: ts.CompilerHost = {
      getSourceFile: (fileName) =>
        fileName === sourceFile.fileName ? sourceFile : undefined,
      getDefaultLibFileName: () => 'lib.d.ts',
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getCanonicalFileName: (f) => f,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      fileExists: (fileName) => fileName === sourceFile.fileName,
      readFile: () => '',
    };

    const program = ts.createProgram(
      [sourceFile.fileName],
      { noEmit: true, allowJs: true },
      compilerHost
    );

    return [...program.getSyntacticDiagnostics(sourceFile)];
  }
}
