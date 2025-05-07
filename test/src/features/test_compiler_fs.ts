import { AutoBeCompiler, IAutoBeCompilerResult } from "@autobe/compiler";
import { TestValidator } from "@nestia/e2e";

export const test_compiler_fs = (): void => {
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const result: IAutoBeCompilerResult = compiler.compile({
    "src/MyConfiguration.ts": FILE,
  });
  TestValidator.equals("result")(result.type)("success");
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
  })();
}
`;
