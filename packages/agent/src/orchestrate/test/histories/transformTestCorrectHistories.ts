import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTestFunction } from "../structures/IAutoBeTestFunction";
import { transformTestWriteHistories } from "./transformTestWriteHistories";

export const transformTestCorrectHistories = (
  func: IAutoBeTestFunction,
  failure: IAutoBeTypeScriptCompileResult.IFailure,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  ...transformTestWriteHistories(func.scenario, func.artifacts),
  {
    id: v7(),
    created_at: new Date().toISOString(),
    type: "assistantMessage",
    text: StringUtil.trim`
      ## Generated TypeScript Code
      \`\`\`typescript
      ${func.script}
      \`\`\`

      ## Compile Errors
      Fix the compilation error in the provided code.

      \`\`\`json
      ${JSON.stringify(failure.diagnostics)}
      \`\`\`
    `,
  },
  {
    id: v7(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: AutoBeSystemPromptConstant.TEST_CORRECT.replace(
      "{{API_DTO_SCHEMAS}}",
      transformTestWriteHistories.structures(func.artifacts),
    ).replace(
      "{{API_SDK_FUNCTIONS}}",
      transformTestWriteHistories.functional(func.artifacts),
    ),
  },
];
