import { IAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTestFunctionFailure } from "../structures/IAutoBeTestFunctionFailure";

export const transformTestCorrectTypiaTagHistories = (
  failures: IAutoBeTestFunctionFailure[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    id: v7(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: AutoBeSystemPromptConstant.TEST_CORRECT_TYPIA_TAG,
  },
  ...failures.map(
    (f, i, array) =>
      ({
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
      # ${i === array.length - 1 ? "Latest Failure" : "Previous Failure"}
      ## Generated TypeScript Code
      \`\`\`typescript
      ${f.function.script}
      \`\`\`
      ## Compile Errors
      \`\`\`json
      ${JSON.stringify(f.failure.diagnostics)}
      \`\`\`
    `,
      }) satisfies IAgenticaHistoryJson.IAssistantMessage,
  ),
];
