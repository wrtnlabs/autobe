import nestiaCoreTransform from "@nestia/core/lib/transform";
import { VariadicSingleton } from "tstl";
import ts from "typescript";
import typiaTransform from "typia/lib/transform";

// import { RAW_TYPINGS } from "./raw/typings/RAW_TYPINGS";
import { IAutoBeCompilerResult } from "./structures/IAutoBeCompilerResult";
import { UnpkgDownloader } from "./utils/UnpkgDownloader";

export class AutoBeCompiler {
  private readonly unpkg: UnpkgDownloader = new UnpkgDownloader();

  public compile(files: Record<string, string>): IAutoBeCompilerResult {
    // PREPARE RAW FILES
    const textFiles: Map<string, string> = new Map();
    const sourceFiles = new VariadicSingleton((file: string) =>
      ts.createSourceFile(
        file,
        textFiles.get(file) ?? this.getExternalFile(file) ?? "",
        ts.ScriptTarget.ESNext,
      ),
    );
    // for (const [file, content] of RAW_TYPINGS) {
    //   const replaced: string = file.replace("file:///", "");
    //   textFiles.set(replaced, content);
    // }
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
        fileExists: (file) => {
          console.log(
            "fileExists",
            file,
            !!this.getExternalFile(file) || textFiles.has(file),
          );
          return !!this.getExternalFile(file) || textFiles.has(file);
        },
        readFile: (file) => {
          return this.getExternalFile(file) ?? textFiles.get(file);
        },
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

  private getExternalFile(file: string): string | undefined {
    if (file.startsWith("node_modules/") === false) return undefined;
    else if (file.endsWith(".d.ts") === false) return undefined;

    const splitted: string[] = file.split("/").filter((s) => s.length !== 0);
    splitted.shift();

    const [lib, path] = splitted[0]!.startsWith("@")
      ? [[splitted[0]!, splitted[1]!].join("/"), splitted.slice(2).join("/")]
      : [splitted[0]!, splitted.slice(1).join("/")];
    return this.unpkg.get(lib, path);
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
