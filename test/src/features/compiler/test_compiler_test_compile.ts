import { AutoBeTestCompiler } from "@autobe/compiler";
import { StringUtil } from "@autobe/compiler/src/utils/StringUtil";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

export const test_compiler_test_compile = async (): Promise<void> => {
  const compiler: AutoBeTestCompiler = new AutoBeTestCompiler();
  const result: IAutoBeTypeScriptCompileResult = await compiler.compile({
    files: {
      "src/api/structures/ISomething.ts": StringUtil.trim`
      import { tags } from "typia";

        export interface ISomething {
          id: string & tags.Format<"uuid">;
        }
      `,
      "test/features/api/test_compile.ts": `
        import { ISomething } from "@ORGANIZATION/PROJECT-api/lib/structures/ISomething";
        import typia from "typia";

        const value: ISomething = typia.random<ISomething>();
        typia.assert(value);
      `,
    },
  });
  TestValidator.equals("result")(result.type)("success");
};
