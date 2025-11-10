import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";
import { transformInterfaceCommonHistories } from "./transformInterfaceCommonHistories";

export const transformInterfaceGroupHistories = (props: {
  state: AutoBeState;
  instruction: string;
}): IAutoBeOrchestrateHistory => {
  const prerequisite = transformInterfaceCommonHistories(props.state);
  if (prerequisite !== null)
    return {
      histories: prerequisite,
      userMessage: "Please wait for prerequisites to complete",
    };

  return {
    histories: [
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

          Follow these instructions when organizing API endpoints.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}
        `,
      },
    ],
    userMessage: "Design API endpoint groups please",
  };
};
