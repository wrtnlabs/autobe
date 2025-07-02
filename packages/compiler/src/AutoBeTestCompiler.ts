import {
  IAutoBeTestCompiler,
  IAutoBeTestWriteProps,
  IAutoBeTypeScriptCompileProps,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { EmbedTypeScript } from "embed-typescript";
import ts from "typescript";
import typiaTransform from "typia/lib/transform";

import TestExternal from "./raw/test.json";
import { writeTestFunction } from "./test/writeTestFunction";

export class AutoBeTestCompiler implements IAutoBeTestCompiler {
  public async compile(
    props: IAutoBeTypeScriptCompileProps,
  ): Promise<IAutoBeTypeScriptCompileResult> {
    const alias: string = props.package ?? "@ORGANIZATION/PROJECT-api";
    const compiler: EmbedTypeScript = new EmbedTypeScript({
      external: TestExternal as Record<string, string>,
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        downlevelIteration: true,
        baseUrl: "./",
        paths: {
          [alias]: ["./src/api"],
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
        ],
      }),
    });
    return compiler.compile(props.files);
  }

  public async write(props: IAutoBeTestWriteProps): Promise<string> {
    return writeTestFunction(props);
  }

  public async getExternal(): Promise<Record<string, string>> {
    return TestExternal as Record<string, string>;
  }
}
