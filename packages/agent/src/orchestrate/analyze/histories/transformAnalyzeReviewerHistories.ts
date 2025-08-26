import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { transformAnalyzeWriteHistories } from "./transformAnalyzeWriteHistories";

export const transformAnalyzeReviewerHistories = <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  scenario: AutoBeAnalyzeScenarioEvent,
  otherFiles: AutoBeAnalyzeFile[],
  myFile: AutoBeAnalyzeFile,
): Array<
  | IAgenticaHistoryJson.IUserMessage
  | IAgenticaHistoryJson.IAssistantMessage
  | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    ...transformAnalyzeWriteHistories(ctx, scenario, myFile),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_REVIEW,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Here are the other documents written in other agents:
        
        \`\`\`json
        ${JSON.stringify(otherFiles)}
        \`\`\`
        
        And here is the target document to review what you have written:
        
        \`\`\`json
        ${JSON.stringify(myFile)}
        \`\`\`
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Review the ${myFile.filename} document.,
        
        Note that, never review others.,
      `,
    },
  ];
};
