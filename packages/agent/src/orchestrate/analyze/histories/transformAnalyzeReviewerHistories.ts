import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { transformAnalyzeWriteHistories } from "./transformAnalyzeWriteHistories";

export const transformAnalyzeReviewerHistories = (
  scenario: AutoBeAnalyzeScenarioEvent,
  file: AutoBeAnalyzeFile,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    ...transformAnalyzeWriteHistories(scenario, file),
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Here is the document what you have written:",
        "",
        "```json",
        JSON.stringify(file),
        "```",
        "",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_REVIEW,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: `You have to review the ${file.filename} document. Don't review others.`,
    },
  ];
};
