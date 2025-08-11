import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";

export function transformAnalyzeSceHistories<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Array<IMicroAgenticaHistoryJson> {
  return [
    ...ctx
      .histories()
      .filter((h) => h.type === "userMessage" || h.type === "assistantMessage"),
    {
      id: v4(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.ANALYZE_SCENARIO,
      created_at: new Date().toISOString(),
    },
    {
      id: v4(),
      type: "systemMessage",
      text: [
        "One agent per page of the document you specify will write according to the instructions below.",
        "You should also refer to the content to define the document list.",
        "```",
        AutoBeSystemPromptConstant.ANALYZE_WRITE,
        "```",
      ].join("\n"),
      created_at: new Date().toISOString(),
    },
  ];
}
