import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeTestFunction } from "../structures/IAutoBeTestFunction";
import { transformTestWriteHistories } from "./transformTestWriteHistories";

export const transformTestCorrectHistories = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  func: IAutoBeTestFunction,
  failure: IAutoBeTypeScriptCompileResult.IFailure,
): Promise<
  Array<
    IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
  >
> => {
  const previous = await transformTestWriteHistories(
    ctx,
    func.scenario,
    func.artifacts,
  );
  return [
    ...previous.slice(0, -1),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_CORRECT,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ${previous.at(-1)!.text}

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
  ];
};
