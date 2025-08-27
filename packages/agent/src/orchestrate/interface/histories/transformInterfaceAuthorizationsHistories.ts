import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeRole } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceAuthorizationsHistories = (
  state: AutoBeState,
  role: AutoBeAnalyzeRole,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_AUTHORIZATION,
    },
    ...transformInterfaceAssetHistories(state),
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        You have to make API operations for the given role:

        ## Role

        \`\`\`json
        ${JSON.stringify(role)}
        \`\`\`

      `,
    },
  ];
};
