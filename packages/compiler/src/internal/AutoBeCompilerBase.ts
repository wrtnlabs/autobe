import { IAutoBeCompiler, IAutoBeCompilerResult } from "@autobe/interface";
import nestiaCoreTransform from "@nestia/core/lib/transform";
import { VariadicSingleton } from "tstl";
import ts from "typescript";
import typiaTransform from "typia/lib/transform";

export class AutoBeCompilerBase implements IAutoBeCompiler {
  public constructor(
    protected readonly external: (file: string) => string | undefined,
    protected readonly externalFiles: string[],
  ) {}

  public async compile(props: {
    files: Record<string, string>;
    paths?: Record<string, string[]> | undefined;
  }): Promise<IAutoBeCompilerResult> {
    const sourceFiles = new VariadicSingleton((f: string) =>
      ts.createSourceFile(
        f,
        this.external(f) ?? props.files[f] ?? "",
        ts.ScriptTarget.ESNext,
      ),
    );

    // MAKE PROGRAM
    const diagnostics: ts.Diagnostic[] = [];
    const javascript: Record<string, string> = {};
    const program: ts.Program = ts.createProgram(
      [...Object.keys(props.files), ...this.externalFiles],
      {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        downlevelIteration: true,
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        paths: props.paths!,
      },
      {
        fileExists: (f) => {
          return !!props.files[f] || !!this.external(f);
        },
        readFile: (f) => {
          return props.files[f] ?? this.external(f);
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
): IAutoBeCompilerResult.DiagnosticCategory => {
  if (value === ts.DiagnosticCategory.Message) return "message";
  else if (value === ts.DiagnosticCategory.Suggestion) return "suggestion";
  else if (value === ts.DiagnosticCategory.Warning) return "warning";
  return "error";
};

const getMessageText = (text: string | ts.DiagnosticMessageChain): string =>
  typeof text === "string" ? text : text.messageText;
