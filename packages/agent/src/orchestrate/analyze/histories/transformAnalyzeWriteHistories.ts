import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeScenarioEvent } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";

export const transformAnalyzeWriteHistories = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    instruction: string;
  },
): Array<
  | IAgenticaHistoryJson.IUserMessage
  | IAgenticaHistoryJson.IAssistantMessage
  | IAgenticaHistoryJson.ISystemMessage
> => [
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
    text: StringUtil.trim`
      ## Language
      
      The language of the document is ${JSON.stringify(props.scenario.language ?? "en-US")}.
      
      ## Metadata
      
      Prefix name of the service to create is ${props.scenario.prefix}
      and here is the list of the roles to reference.
      
      \`\`\`json
      ${JSON.stringify(props.scenario.roles)}
      \`\`\`
      
      Here is the entire list of the documents that would be published
      in someday, and your role is to writing a document of them:
      
      ## The other documents that would be published in someday

      \`\`\`json
      ${JSON.stringify(
        props.scenario.files.filter((f) => f.filename !== props.file.filename),
      )}
      \`\`\`
      
      ## The document to write
      \`\`\`json
      ${JSON.stringify(props.file)}
      \`\`\`

      ## Instructions from Requirements Discussion
      
      The following instructions were extracted by AI from 
      the discussion with the user about requirements.
      If these instructions are relevant to the document you're 
      currently writing (${props.file.filename}), incorporate 
      them appropriately. 
      
      If not relevant to this specific document, ignore them.
      
      ${props.instruction}
    `,
  },
];
