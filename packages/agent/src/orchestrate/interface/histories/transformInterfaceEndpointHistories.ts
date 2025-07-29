import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceEndpointHistories = (
  state: AutoBeState,
  group: AutoBeInterfaceGroup,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    type: "systemMessage",
    id: v4(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_ENDPOINT,
  },
  ...transformInterfaceAssetHistories(state),
  {
    type: "assistantMessage",
    id: v4(),
    created_at: new Date().toISOString(),
    text: [
      "Here is the target group for the endpoints:",
      "",
      "```json",
      JSON.stringify(group),
      "```",
    ].join("\n"),
  },
];
