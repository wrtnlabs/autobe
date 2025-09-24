import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";

export function transformAnalyzeSceHistories<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  instruction: string,
): Array<IMicroAgenticaHistoryJson> {
  return [
    ...ctx
      .histories()
      .filter((h) => h.type === "userMessage" || h.type === "assistantMessage"),
    {
      id: v7(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_SCENARIO,
      created_at: new Date().toISOString(),
    },
    {
      id: v7(),
      type: "systemMessage",
      text: StringUtil.trim`
        > One agent per page of the document you specify will 
        > write according to the instructions below. You should also refer 
        > to the content to define the document list.

        ----------------------

        ${AutoBeSystemPromptConstant.ANALYZE_WRITE}
      `,
      created_at: new Date().toISOString(),
    },
    {
      id: v7(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Instructions from Requirements Discussion
        
        The following instructions were extracted by AI from 
        the discussion with the user about requirements.
        Use these to guide document structure planning and 
        scenario definitions.
        
        ${instruction}
      `,
      created_at: new Date().toISOString(),
    },
  ];
}
