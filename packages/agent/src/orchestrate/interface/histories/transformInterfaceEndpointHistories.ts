import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceEndpointHistories = (
  state: AutoBeState,
  group: AutoBeInterfaceGroup,
  authorizations: AutoBeOpenApi.IOperation[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    type: "systemMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_ENDPOINT,
  },
  ...transformInterfaceAssetHistories(state),
  {
    type: "assistantMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: [
      "Here is the target group for the endpoints:",
      "",
      "```json",
      JSON.stringify(group),
      "```",
      "",
      "**IMPORTANT: DO NOT DUPLICATE EXISTING OPERATIONS**",
      "",
      "These operations already exist. Do NOT create similar endpoints:",
      "",
      "```json",
      JSON.stringify(
        authorizations.map((op) => ({
          path: op.path,
          method: op.method,
          name: op.name,
          summary: op.summary,
        })),
      ),
      "```",
    ].join("\n"),
  },
];
