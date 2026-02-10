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
    const issues: Issue[] = [];
    let totalFiles = 0;
    let filesWithErrors = 0;

    for (const filePath of context.files.typescript) {
      totalFiles++;

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileIssues = this.checkSyntax(filePath, content);

        if (fileIssues.length > 0) {
          filesWithErrors++;
          issues.push(...fileIssues);
        }
      } catch (error) {
        issues.push(
          createIssue({
            severity: 'critical',
            category: 'syntax-error',
            code: 'E001',
            message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            location: { file: filePath, line: 1 },
            autoFixable: false,
          })
        );
        filesWithErrors++;
      }
    }

    return {
      passed: issues.filter((i) => i.severity === 'critical').length === 0,
      issues,
      metrics: {
        totalFiles,
        filesWithErrors,
        syntaxErrorCount: issues.length,
      },
    };
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
    // Use a minimal compiler host to get syntax diagnostics
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
