import { IAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";
import { transformInterfacePrerequisiteHistories } from "./transformInterfacePrerequisiteHistories";

export const transformInterfaceGroupHistories = (props: {
  state: AutoBeState;
  instruction: string;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const prerequisite = transformInterfacePrerequisiteHistories(props.state);
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
        The following API-spec instructions were extracted by AI from
        the user's utterances. These focus ONLY on API design aspects such as
        endpoint structure, request/response formats, authentication methods, etc.

        Reference these instructions when you design the interface groups. 
        If the instruction is not related to any group what you have to make,
        just ignore it.

        ${props.instruction}
      `,
    },
  ];
};
