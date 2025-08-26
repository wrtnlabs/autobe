import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";

export const transformAnalyzeWriteHistories = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenario: AutoBeAnalyzeScenarioEvent,
  file: AutoBeAnalyzeFile.Scenario,
): Array<
  | IAgenticaHistoryJson.IUserMessage
  | IAgenticaHistoryJson.IAssistantMessage
  | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    ...ctx
      .histories()
      .filter((h) => h.type === "userMessage" || h.type === "assistantMessage")
      .map((h) => {
        const text =
          h.type === "userMessage"
            ? h.contents
                .filter((el) => el.type === "text")
                .map((el) => el.text)
                .join("\n")
            : h.text;

        return {
          ...h,
          text,
        };
      }),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_WRITE,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "## Metadata",
        "",
        `Prefix name of the service to create is ${scenario.prefix},`,
        "and here is the list of the roles to reference:",
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
        "## The document to write",
        "```json",
        JSON.stringify(file),
        "```",
        "",
        "## Language",
        "",
        `The language of the document is ${scenario.language ?? "en-US"}.`,
      ].join("\n"),
    },
  ];
};
