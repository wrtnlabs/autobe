import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceOperationHistories = (
  state: AutoBeState,
  endpoints: AutoBeOpenApi.IEndpoint[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    type: "systemMessage",
    id: v4(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_OPERATION,
  },
  ...transformInterfaceAssetHistories(state),
  {
    type: "assistantMessage",
    id: v4(),
    created_at: new Date().toISOString(),
    text: [
      "You have to make API operations for the given endpoints:",
      "",
      "```json",
      JSON.stringify(endpoints),
      "```",
    ].join("\n"),
  },
];
