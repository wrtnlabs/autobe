import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceComplementHistories = (
  state: AutoBeState,
  document: AutoBeOpenApi.IDocument,
  missed: string[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    type: "systemMessage",
    id: v4(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_COMPLEMENT,
  },
  ...transformInterfaceAssetHistories(state),
  {
    type: "assistantMessage",
    id: v4(),
    created_at: new Date().toISOString(),
    text: [
      "Here is the OpenAPI document what you've made:",
      "",
      "```json",
      JSON.stringify(document),
      "```",
    ].join("\n"),
  },
  {
    type: "assistantMessage",
    id: v4(),
    created_at: new Date().toISOString(),
    text: [
      "You have missed below schema types in the document.components.schemas:",
      "",
      ...missed.map((s) => `- ${s}`),
    ].join("\n"),
  },
];
