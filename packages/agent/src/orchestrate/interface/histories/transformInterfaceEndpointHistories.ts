import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import { v4 } from "uuid";

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
      "",
      "**IMPORTANT EXCLUSION RULE:**",
      "DO NOT create endpoints that match any of the authorization operations listed below. These operations already exist and should be excluded from the new endpoint generation.",
      "",
      "Here are the existing authorization operations to EXCLUDE:",
      "",
      "```json",
      JSON.stringify(
        authorizations.map((op) => ({
          path: op.path,
          method: op.method,
          name: op.name,
          authorizationRole: op.authorizationRole,
          description: op.description,
        })),
        null,
        2,
      ),
      "```",
      "",
      "When generating new operations, ensure that none of them have the same combination of `path` and `method` as any operation listed above.",
      "",
    ].join("\n"),
  },
];
