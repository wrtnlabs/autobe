import nestiaCoreTransform from "@nestia/core/lib/transform";
import { VariadicSingleton } from "tstl";
import ts from "typescript";
import typiaTransform from "typia/lib/transform";

import { RAW_TYPINGS } from "./raw/typings/RAW_TYPINGS";
import { IAutoBeCompilerResult } from "./structures/IAutoBeCompilerResult";

export class AutoBeCompiler {
  public compile(files: Record<string, string>): IAutoBeCompilerResult {
    // PREPARE RAW FILES
    const textFiles: Map<string, string> = new Map();
    const sourceFiles = new VariadicSingleton((file: string) =>
      ts.createSourceFile(
        file,
        textFiles.get(file) ?? "",
        ts.ScriptTarget.ESNext,
      ),
    );
    for (const [file, content] of RAW_TYPINGS) {
      // if (file.endsWith("packageJson.d.ts")) continue;
      const replaced: string = file.replace("file:///", "");
      textFiles.set(replaced, content);
    }
    for (const [key, value] of Object.entries(files)) textFiles.set(key, value);

    // MAKE PROGRAM
    const diagnostics: ts.Diagnostic[] = [];
    const javascript: Record<string, string> = {};
    const program: ts.Program = ts.createProgram(
      Object.keys(files),
      {
        target: ts.ScriptTarget.ESNext,
        downlevelIteration: true,
        strict: true,
        module: ts.ModuleKind.CommonJS,
      },
      {
        fileExists: (file) => textFiles.has(file),
        readFile: (file) => textFiles.get(file),
        writeFile: (file, content) => (javascript[file] = content),
        getSourceFile: (file) => sourceFiles.get(file),
        getDefaultLibFileName: () =>
          "node_modules/typescript/lib/lib.es2015.d.ts",
        directoryExists: () => true,
        getCurrentDirectory: () => "",
        getDirectories: () => [],
        getNewLine: () => "\n",
        getCanonicalFileName: (file) => file,
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
