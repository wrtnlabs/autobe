import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeRole } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceAuthorizationHistories = (
  state: AutoBeState,
  role: AutoBeAnalyzeRole,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_AUTHORIZATION,
    },
    ...transformInterfaceAssetHistories(state),
    {
      type: "assistantMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: [
        "You have to make API operations for the given role:",
        "",
        "## Role",
        "",
        "```json",
        JSON.stringify(role),
        "```",
        "",
        "",
      ].join("\n"),
    },
  ];
};
