import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeHistory,
  AutoBeTestHistory,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import OpenAI from "openai";
import typia from "typia";

import { TestHistory } from "../../internal/TestHistory";

export const test_compiler_test_build = async () => {
  if (TestHistory.has("todo", "test") === false) return false;

  const histories: AutoBeHistory[] = await TestHistory.getHistories(
    "todo",
    "test",
  );
  const testHistory: AutoBeTestHistory = typia.assert<AutoBeTestHistory>(
    histories.at(-1),
  );
  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: "" }),
      model: "gpt-4.1",
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories: histories.slice(0, -1),
  });

  const files: Record<string, string> = {
    ...(await agent.getFiles()),
    ...Object.fromEntries(
      testHistory.files.map((file) => [file.location, file.content]),
    ),
  };
  const result: IAutoBeTypeScriptCompileResult = await (
    await agent.getContext().compiler()
  ).typescript.compile({
    files: Object.fromEntries(
      Object.entries(files).filter(([key]) => key.endsWith(".ts")),
    ),
  });
  TestValidator.equals("result")(result.type)("success");
};
