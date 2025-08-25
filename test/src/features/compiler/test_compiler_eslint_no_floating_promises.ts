import { AutoBeEsLintCompiler } from "@autobe/compiler";
import { StringUtil } from "@autobe/utils";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import ts from "typescript";

export const test_compiler_eslint_no_floating_promises =
  async (): Promise<void> => {
    const compiler: AutoBeEsLintCompiler = new AutoBeEsLintCompiler({
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        strict: true,
        lib: ["ES2020", "DOM"],
      },
      external: {
        "node_modules/@types/node/globals.d.ts": StringUtil.trim`
          declare function fetch(input: string): Promise<Response>;
          interface Response {
            json(): Promise<any>;
          }
        `,
      },
      rules: {
        "no-floating-promises": tsEslintPlugin.rules["no-floating-promises"],
      },
    });
    const result = compiler.compile({
      "src/main.ts": StringUtil.trim`
        const main = async () => {
          fetch("https://api.example.com/data");
        };
        main().catch(console.error);
      `,
    });
    console.log(result);
  };
