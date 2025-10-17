import { IAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";
import { transformInterfaceCommonHistories } from "./transformInterfaceCommonHistories";

export const transformInterfaceGroupHistories = (props: {
  state: AutoBeState;
  instruction: string;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const prerequisite = transformInterfaceCommonHistories(props.state);
  if (prerequisite !== null) return prerequisite;

  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.INTERFACE_ENDPOINT,
    },
    ...transformInterfaceAssetHistories(props.state),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.INTERFACE_GROUP,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## API Design Instructions

        The following API-specific instructions were extracted from
        the user's requirements. These focus on API interface design aspects
        such as endpoint patterns, request/response formats, DTO schemas,
        and operation specifications.

        These instructions are provided as reference when organizing API endpoints
        into logical groups based on business domains, resource types, or
        functional areas.

        ${props.instruction}
      `,
    },
  ];
};
