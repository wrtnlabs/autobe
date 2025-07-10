import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";

export const transformTestCorrectHistories = (
  // ctx: AutoBeContext<Model>,
  written: IAutoBeTestWriteResult,
  failure: IAutoBeTypeScriptCompileResult.IFailure,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_WRITE,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "## Original Code",
        "## `AutoBeTest.IFunction` data",
        "```json",
        JSON.stringify(written.file.function),
        "```",
        "## Generated TypeScript Code",
        "```typescript",
        written.file.content,
        "```",
        "",
        "## Compile Errors",
        "Fix the compilation error in the provided code.",
        "",
        "```json",
        JSON.stringify(failure.diagnostics),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_CORRECT,
    },
  ];
};
