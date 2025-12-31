import { AutoBeAnalyzeActor } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformRealizeAuthorizationWriteHistory = (props: {
  actor: AutoBeAnalyzeActor;
  preliminary: AutoBePreliminaryController<"databaseSchemas">;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_AUTHORIZATION_WRITE,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: StringUtil.trim`
          ## Actor

          \`\`\`json
          ${JSON.stringify(props.actor)}
          \`\`\`

          ## Component Naming Convention

          Please follow this naming convention for the authorization components:

          - Provider Name: ${props.actor.name}Authorize (e.g. ${props.actor.name}Authorize)
          - Decorator Name: ${props.actor.name.charAt(0).toUpperCase() + props.actor.name.slice(1)}Auth (e.g. ${props.actor.name.charAt(0).toUpperCase() + props.actor.name.slice(1)}Auth)
          - Payload Name: ${props.actor.name.charAt(0).toUpperCase() + props.actor.name.slice(1)}Payload (e.g. ${props.actor.name.charAt(0).toUpperCase() + props.actor.name.slice(1)}Payload)
        `,
      },
    ],
    userMessage: `Create authorization components for ${props.actor.name} actor please`,
  };
};
