import { AutoBeTypeScriptCompiler } from "@autobe/compiler";
import { TestValidator } from "@nestia/e2e";

export const test_compiler_typescript_import = async () => {
  await process("ISomething", "success");
  await process("ISomethingX", "failure");
};

const process = async (name: string, expected: "success" | "failure") => {
  const compiler: AutoBeTypeScriptCompiler = new AutoBeTypeScriptCompiler();
  const result = await compiler.compile({
    files: {
      "src/api/structures/ISomething.ts": "export interface ISomething {}",
      "src/main.ts": `
        import { ${name} } from "@ORGANIZATION/PROJECT-api/lib/structures/ISomething";
        const x: ${name} = {};
        console.log(x);
      `,
    },
  });
  TestValidator.equals("result")(result.type)(expected);
};
