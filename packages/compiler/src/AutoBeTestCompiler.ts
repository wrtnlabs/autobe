import {
  AutoBeOpenApi,
  IAutoBeTestCompiler,
  IAutoBeTestValidateProps,
  IAutoBeTestWriteProps,
  IAutoBeTypeScriptCompileProps,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { EmbedTypeScript } from "embed-typescript";
import { HashMap, Pair } from "tstl";
import ts from "typescript";
import { IValidation } from "typia";
import typiaTransform from "typia/lib/transform";

import { AutoBeEndpointComparator } from "./interface/AutoBeEndpointComparator";
import TestExternal from "./raw/test.json";
import { writeTestFunction } from "./test/programmers/writeTestFunction";
import { validateTestFunction } from "./test/validators/validateTestFunction";

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

  public async validate(
    props: IAutoBeTestValidateProps,
  ): Promise<IValidation.IError[] | null> {
    const errors: IValidation.IError[] = [];
    const endpoints: HashMap<
      AutoBeOpenApi.IEndpoint,
      AutoBeOpenApi.IOperation
    > = new HashMap(
      props.document.operations.map(
        (op) =>
          new Pair(
            {
              method: op.method,
              path: op.path,
            },
            op,
          ),
      ),
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    );
    validateTestFunction({
      function: props.function,
      document: props.document,
      endpoints: endpoints,
      errors,
    });
    return errors.length !== 0 ? errors : null;
  }

  public async write(props: IAutoBeTestWriteProps): Promise<string> {
    return writeTestFunction(props);
  }

  public async getExternal(): Promise<Record<string, string>> {
    return TestExternal as Record<string, string>;
  }
}
