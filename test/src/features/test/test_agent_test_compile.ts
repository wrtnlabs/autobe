import { filterTestFileName } from "@autobe/agent/src/orchestrate/test/filterTestFileName";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeHistory,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import data from "./internal/compiled-histories.json";

export const test_agent_test_compile = async (): Promise<void> => {
  const histories: AutoBeHistory[] = typia.assert<AutoBeHistory[]>(data);
  const files: Record<string, string> = Object.fromEntries([
    ...Object.entries(
      histories.find((h) => h.type === "interface")?.files!,
    ).filter(([key]) => filterTestFileName(key)),
    ...histories
      .find((h) => h.type === "test")!
      .files.map((file) => [file.location, file.content])
      .filter(([key]) => filterTestFileName(key)),
  ]);
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const result: IAutoBeTypeScriptCompilerResult =
    await compiler.typescript.compile({
      files,
    });
  TestValidator.equals("result")(result.type)("success");
};
