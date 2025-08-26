import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v7 } from "uuid";

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
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_OPERATION,
  },
  ...transformInterfaceAssetHistories(state),
  {
    type: "assistantMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: [
      "Here is the OpenAPI operations what you AI have made:",
      "",
      "```json",
      JSON.stringify(document.operations),
      "```",
    ].join("\n"),
  },
  {
    type: "systemMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
  },
  {
    type: "assistantMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: [
      "Here is the OpenAPI schemas what you AI have made:",
      "",
      "```json",
      JSON.stringify(document.components.schemas),
      "```",
    ].join("\n"),
  },
  {
    type: "systemMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_COMPLEMENT,
  },
  {
    type: "assistantMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: [
      "You AI have missed below schema types:",
      "",
      ...missed.map((s) => `- ${s}`),
    ].join("\n"),
  },
];
