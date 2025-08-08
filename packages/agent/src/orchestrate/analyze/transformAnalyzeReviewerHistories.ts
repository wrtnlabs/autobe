import { IAgenticaHistoryJson } from "@agentica/core";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeAnalyzeWriteProps } from "./structures/AutoBeAnalyzeWriteProps";

export const transformAnalyzeReviewerHistories = (
  props: AutoBeAnalyzeWriteProps,
  input: {
    /** Total file names */
    files: Record<string, string>;
  },
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "Below are all of the files.",
        "```json",
        JSON.stringify(input.files),
        "```",
        "",
        "These files are written under the following conditions.",
        "You should refer to these contents and make a review.",
        "```json",
        JSON.stringify(props),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_REVIEWER,
    },
  ];
};
