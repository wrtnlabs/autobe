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

        The following API-specific instructions were extracted by AI from
        the user's utterances. These focus ONLY on API interface design aspects
        such as endpoint patterns, request/response formats, DTO schemas,
        and operation specifications.

        Apply these instructions when organizing API endpoints into logical groups.
        Consider how to structure and categorize endpoints based on business domains,
        resource types, or functional areas. If the instructions are relevant
        to endpoint grouping and organization, you MUST follow them exactly without
        arbitrary judgment. DO NOT make your own decisions even if you think you have
        better ideas. Only ignore instructions that are completely unrelated to
        endpoint grouping and organization.

        ${props.instruction}
      `,
    },
  ];
};
