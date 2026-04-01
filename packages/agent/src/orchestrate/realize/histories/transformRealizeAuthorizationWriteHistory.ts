import { AutoBeAnalyze } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { IAutoBeRealizeAuthorizationWriteApplication } from "../structures/IAutoBeRealizeAuthorizationWriteApplication";

export const transformRealizeAuthorizationWriteHistory = (props: {
  actor: AutoBeAnalyze.IActor;
  preliminary: AutoBePreliminaryController<"databaseSchemas">;
  previousWrite: IAutoBeRealizeAuthorizationWriteApplication.IWrite | null;
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
      ...(props.previousWrite !== null
        ? [
            {
              id: v7(),
              created_at: new Date().toISOString(),
              type: "assistantMessage" as const,
              text: StringUtil.trim`
                Previously submitted components (your last write):

                \`\`\`json
                ${JSON.stringify(
                  {
                    provider: props.previousWrite.provider,
                    decorator: props.previousWrite.decorator,
                    payload: props.previousWrite.payload,
                  },
                  null,
                  2,
                )}
                \`\`\`

                You may revise these components by submitting another write, or
                call complete if they are correct.
              `,
            },
          ]
        : []),
    ],
    userMessage: `Create authorization components for ${props.actor.name} actor please`,
  };
};
