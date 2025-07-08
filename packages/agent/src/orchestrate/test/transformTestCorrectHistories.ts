import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";
import { transformTestWriteHistories } from "./transformTestWriteHistories";

export const transformTestCorrectHistories = (
  written: IAutoBeTestWriteResult,
  failure: IAutoBeTypeScriptCompileResult.IFailure,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  ...transformTestWriteHistories(written.scenario, written.artifacts),
  {
    id: v4(),
    created_at: new Date().toISOString(),
    type: "assistantMessage",
    text: [
      "## Generated TypeScript Code",
      "```typescript",
      written.event.final,
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
