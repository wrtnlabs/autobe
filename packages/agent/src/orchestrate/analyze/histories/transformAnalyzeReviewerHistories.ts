import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { transformAnalyzeWriteHistories } from "./transformAnalyzeWriteHistories";

export const transformAnalyzeReviewerHistories = (
  scenario: AutoBeAnalyzeScenarioEvent,
  otherFiles: AutoBeAnalyzeFile[],
  myFile: AutoBeAnalyzeFile,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    ...transformAnalyzeWriteHistories(scenario, myFile),
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Here are the other documents written in other agents:",
        "",
        "```json",
        JSON.stringify(otherFiles),
        "```",
        "",
        "And here is the target document to review what you have written:",
        "",
        "```json",
        JSON.stringify(myFile),
        "```",
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
      text: [
        `You have to review the ${myFile.filename} document.`,
        "",
        "Note that, never review others.",
      ].join("\n"),
    },
  ];
};
