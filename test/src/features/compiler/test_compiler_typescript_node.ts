import { AutoBeTypeScriptCompiler } from "@autobe/compiler";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_compiler_typescript_node = async (): Promise<void> => {
  const compiler: AutoBeTypeScriptCompiler = new AutoBeTypeScriptCompiler();
  const result: IAutoBeTypeScriptCompileResult = await compiler.compile({
    files: {
      "src/MyConfiguration.ts": FILE,
    },
  });
  if (result.type === "failure") console.log(result.diagnostics);
  TestValidator.equals("result", result.type, "success");
  typia.assertEquals(result);
};

const FILE = `
import fs from "fs";
import path from "path";

export namespace MyConfiguration {
  export const ROOT = (() => {
    const split: string[] = __dirname.split(path.sep);
    return split.at(-1) === "src" && split.at(-2) === "bin"
      ? path.resolve(__dirname + "/../..")
      : fs.existsSync(__dirname + "/.env")
        ? __dirname
        : path.resolve(__dirname + "/..");
  });
}
`;
