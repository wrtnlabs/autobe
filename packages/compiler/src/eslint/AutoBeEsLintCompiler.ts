import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import * as tsParser from "@typescript-eslint/parser";
import {
  EmbedTypeScript,
  IEmbedTypeScriptDiagnostic,
  IEmbedTypeScriptFountain,
  IEmbedTypeScriptProps,
  IEmbedTypeScriptResult,
} from "embed-typescript";
import { Linter } from "eslint";
import { IPointer } from "tstl";
import ts from "typescript";

export class AutoBeEsLintCompiler {
  private readonly tsc: EmbedTypeScript;
  private readonly linter: Linter;

  public constructor(private readonly props: AutoBeEsLintCompiler.IProps) {
    this.tsc = new EmbedTypeScript(props);
    this.linter = new Linter({
      configType: "flat",
    });
    this.linter.defineParser("@typescript-eslint/parser", tsParser);
    Object.entries(props.rules).forEach(([key, value]) => {
      this.linter.defineRule(`@typescript-eslint/${key}`, value as any);
    });
  }

  public compile(
    files: Record<string, string>,
  ): IAutoBeTypeScriptCompileResult {
    const result: IEmbedTypeScriptResult = this.compileProject(files);
    return result.type === "success"
      ? { type: "success" }
      : result.type === "failure"
        ? { type: "failure", diagnostics: result.diagnostics }
        : { type: "exception", error: result.error };
  }

  private compileProject(
    files: Record<string, string>,
  ): IEmbedTypeScriptResult {
    const ptr: IPointer<IEmbedTypeScriptFountain | null> = {
      value: null,
    };
    const result: IEmbedTypeScriptResult = this.tsc.compile(files, ptr);
    if (ptr.value === null)
      // unreachable code
      throw new Error("Faileld to get fountain.");
    if (result.type !== "exception")
      try {
        const diagnostics: IEmbedTypeScriptDiagnostic[] = [];
        for (const [key, value] of Object.entries(files))
          diagnostics.push(...this.compileFile(key, value, ptr.value.program));
        if (result.type === "failure")
          return {
            ...result,
            diagnostics: [...result.diagnostics, ...diagnostics],
          };
        else if (result.type === "success" && diagnostics.length !== 0)
          return {
            ...result,
            diagnostics,
            type: "failure",
          };
      } catch (error) {
        return {
          type: "exception",
          error,
        };
      }
    return result;
  }

  private compileFile(
    fileName: string,
    sourceCode: string,
    program: ts.Program,
  ): IEmbedTypeScriptDiagnostic[] {
    const config: Linter.FlatConfig[] = [
      {
        languageOptions: {
          parser: tsParser,
          parserOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
          },
        },
        plugins: {
          "@typescript-eslint": tsEslintPlugin as any,
        },
        rules: Object.fromEntries(
          Object.entries(this.props.rules).map(([key, value]) => [
            `@typescript-eslint/${key}`,
            value,
          ]),
        ),
      },
    ];

    (global as any).__TS_PROGRAM__ = program;
    try {
      const report: Linter.FixReport = this.linter.verifyAndFix(
        sourceCode,
        config,
        fileName,
      );
      return report.messages.map((msg) =>
        transformMessage(msg, fileName, sourceCode),
      );
    } finally {
      delete (global as any).__TS_PROGRAM__;
    }
  }
}
export namespace AutoBeEsLintCompiler {
  export interface IProps extends IEmbedTypeScriptProps {
    rules: Record<string, any>;
  }
}

const transformMessage = (
  message: Linter.LintMessage,
  fileName: string,
  sourceCode: string,
): IEmbedTypeScriptDiagnostic => ({
  category: message.severity === 2 ? "error" : "warning",
  code: message.messageId ?? "eslint",
  file: {
    fileName,
    text: sourceCode,
    getLineAndCharacterOfPosition: () => ({
      line: message.line - 1,
      character: message.column - 1,
    }),
  } as any,
  start: 0, // ESLint doesn't provide exact positions
  length: 0,
  messageText: message.message,
});
