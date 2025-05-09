import {
  IAutoBeTypeScriptCompiler,
  IAutoBeTypeScriptCompilerProps,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import nestiaCoreTransform from "@nestia/core/lib/transform";
import { Singleton, VariadicSingleton } from "tstl";
import ts from "typescript";
import typiaTransform from "typia/lib/transform";

import EXTERNAL from "./raw/typings.json";

export class AutoBeTypeScriptCompiler implements IAutoBeTypeScriptCompiler {
  public async compile(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult> {
    // PREPARE ASSETS
    const external: Record<string, string> = EXTERNAL as Record<string, string>;
    const alias: string = props.package ?? "@ORGANIZATION/PROJECT-api";
    const files: Record<string, string> = {
      ...props.files,
      ...(props.prisma ?? {}),
    };
    const sourceFiles = new VariadicSingleton((f: string) =>
      ts.createSourceFile(
        f,
        external[f] ?? files[f] ?? "",
        ts.ScriptTarget.ESNext,
      ),
    );

    // MAKE PROGRAM
    const diagnostics: ts.Diagnostic[] = [];
    const javascript: Record<string, string> = {};
    const program: ts.Program = ts.createProgram(
      [...Object.keys(files), ...externalDefinitions.get()],
      {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        downlevelIteration: true,
        paths: {
          [alias]: ["./src/api"],
          [`${alias}/lib/`]: ["./src/api"],
          [`${alias}/lib/*`]: ["./src/api/*"],
        },
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
      {
        fileExists: (f) => {
          return !!files[f] || !!external[f];
        },
        readFile: (f) => {
          return files[f] ?? external[f];
        },
        writeFile: (f, c) => (javascript[f] = c),
        getSourceFile: (f) => sourceFiles.get(f),
        getDefaultLibFileName: () =>
          "node_modules/typescript/lib/lib.es2015.d.ts",
        directoryExists: () => true,
        getCurrentDirectory: () => "",
        getDirectories: () => [],
        getNewLine: () => "\n",
        getCanonicalFileName: (f) => f,
        useCaseSensitiveFileNames: () => false,
        jsDocParsingMode: ts.JSDocParsingMode.ParseAll,
      },
    );

    // DO COMPILE
    program.emit(undefined, undefined, undefined, undefined, {
      before: [
        typiaTransform(
          program,
          {},
          {
            addDiagnostic: (input) => diagnostics.push(input),
          },
        ),
        nestiaCoreTransform(
          program,
          {},
          {
            addDiagnostic: (input) => diagnostics.push(input),
          },
        ),
      ],
    });
    diagnostics.push(...ts.getPreEmitDiagnostics(program));
    if (diagnostics.length)
      return {
        type: "failure",
        javascript,
        diagnostics: diagnostics.map((diag) => ({
          file: diag.file?.fileName ?? null,
          category: getCategory(diag.category),
          code: diag.code,
          start: diag.start,
          length: diag.length,
          messageText: getMessageText(diag.messageText),
        })),
      };
    return {
      type: "success",
      javascript,
    };
  }
}

const getCategory = (
  value: ts.DiagnosticCategory,
): IAutoBeTypeScriptCompilerResult.DiagnosticCategory => {
  if (value === ts.DiagnosticCategory.Message) return "message";
  else if (value === ts.DiagnosticCategory.Suggestion) return "suggestion";
  else if (value === ts.DiagnosticCategory.Warning) return "warning";
  return "error";
};

const getMessageText = (text: string | ts.DiagnosticMessageChain): string =>
  typeof text === "string" ? text : text.messageText;

const externalDefinitions = new Singleton(() =>
  Object.keys(EXTERNAL).filter((f) => f.endsWith(".d.ts")),
);
