import {
  IAutoBeTypeScriptCompiler,
  IAutoBeTypeScriptCompilerProps,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import nestiaCoreTransform from "@nestia/core/lib/transform";
import { EmbedTypeScript } from "embed-typescript";
import ts from "typescript";
import typiaTransform from "typia/lib/transform";

import EXTERNAL from "./raw/external.json";

export class AutoBeTypeScriptCompiler implements IAutoBeTypeScriptCompiler {
  public async compile(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult> {
    const alias: string = props.package ?? "@ORGANIZATION/PROJECT-api";
    const compiler: EmbedTypeScript = new EmbedTypeScript({
      external: EXTERNAL as Record<string, string>,
      compilerOptions: {
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
      transformers: (program, diagnostics) => ({
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
      }),
    });
    return compiler.compile({
      ...props.files,
      ...(props.prisma ?? {}),
    });
  }
}
