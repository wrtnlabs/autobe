import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformAnalyzeWriteHistories = (
  scenario: AutoBeAnalyzeScenarioEvent,
  file: AutoBeAnalyzeFile.Scenario,
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
        "## Metadata",
        "",
        `Prefix name of the service to create is ${scenario.prefix},`,
        "and here is the list of the roles you should reference:",
        "",
        "```json",
        JSON.stringify(scenario.roles),
        "```",
        "",
        "Here is the entire list of the documents that would be published",
        "in someday, and your role is to writing a document of them:",
        "",
        "## The other documents that would be published in someday",
        "```json",
        JSON.stringify(
          scenario.files.filter((f) => f.filename !== file.filename),
        ),
        "```",
        "",
        "## The document what you have to write",
        "```json",
        JSON.stringify(file),
        "```",
      ].join("\n"),
    },
  ];
};
