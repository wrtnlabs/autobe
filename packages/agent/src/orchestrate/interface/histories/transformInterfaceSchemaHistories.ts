import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaHistories = (
  state: AutoBeState,
  operations: AutoBeOpenApi.IOperation[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    type: "systemMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: AutoBeSystemPromptConstant.INTERFACE_SCHEMA,
  },
  ...transformInterfaceAssetHistories(state),
  {
    type: "assistantMessage",
    id: v7(),
    created_at: new Date().toISOString(),
    text: StringUtil.trim`
      Here is the list of API operations you have to implement its types:

      \`\`\`json
      ${JSON.stringify(operations)}
      \`\`\`
    `,
  },
];
