import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformAnalyzeReviewerHistories = (
  scenario: AutoBeAnalyzeScenarioEvent,
  file: AutoBeAnalyzeFile,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_WRITE,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Below are all of the files.",
        "```json",
        JSON.stringify(file),
        "```",
        "",
        "These files are written under the following conditions.",
        "You should refer to these contents and make a review.",
        "```json",
        JSON.stringify({
          prefix: scenario.prefix,
          roles: scenario.roles,
        }),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_REVIEW,
    },
  ];
};
