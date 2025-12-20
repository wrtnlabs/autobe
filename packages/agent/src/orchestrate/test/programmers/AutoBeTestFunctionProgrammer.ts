import {
  AutoBeOpenApi,
  AutoBeTestFunction,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { v7 } from "uuid";

export namespace AutoBeTestFunctionProgrammer {
  export async function compile<Function extends AutoBeTestFunction>(props: {
    compiler: IAutoBeCompiler;
    document: AutoBeOpenApi.IDocument;
    function: Function;
    files: Record<string, string>;
    step: number;
  }): Promise<AutoBeTestValidateEvent<Function>> {
    const template: Record<string, string> = Object.fromEntries(
      Object.entries(
        await props.compiler.getTemplate({
          dbms: "sqlite",
          phase: "test",
        }),
      ).filter(([key]) => key.startsWith("test/utils") && key.endsWith(".ts")),
    );
    const artifacts: Record<string, string> =
      await props.compiler.interface.write(props.document, []);
    const sdk: Record<string, string> = Object.fromEntries(
      Object.entries(artifacts).filter(
        ([key]) =>
          key.startsWith("src/api") && !key.startsWith("src/api/structures"),
      ),
    );
    const dto: Record<string, string> = Object.fromEntries(
      Object.entries(artifacts).filter(([key]) =>
        key.startsWith("src/api/structures"),
      ),
    );

    const everything: Record<string, string> = {
      ...template,
      ...sdk,
      ...dto,
      ...props.files,
      ...(await props.compiler.test.getDefaultTypes()),
    };
    const result: IAutoBeTypeScriptCompileResult =
      await props.compiler.test.compile({
        files: everything,
      });
    return {
      type: "testValidate",
      id: v7(),
      function: props.function,
      result,
      created_at: new Date().toISOString(),
      step: props.step,
    };
  }

  export function writeImportStatements(
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ): string[] {
    const typeReferences: Set<string> = new Set(
      Object.keys(schemas).map((key) => key.split(".")[0]!),
    );
    return [
      `import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";`,
      `import { IConnection } from "@nestia/fetcher";`,
      `import { randint } from "tstl";`,
      `import typia, { tags } from "typia";`,
      `import api from "@ORGANIZATION/PROJECT-api";`,
      `import { DeepPartial } from "@ORGANIZATION/PROJECT-api/lib/typings/DeepPartial";`,
      `import { IEntity } from "@ORGANIZATION/PROJECT-api/lib/structures/IEntity";`,
      ...Array.from(typeReferences)
        .sort()
        .map(
          (ref) =>
            `import type { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
        ),
    ];
  }
}
