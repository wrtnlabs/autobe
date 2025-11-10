import { AutoBeAnalyzeActor } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

export const transformRealizeAuthorizationHistories = <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  actor: AutoBeAnalyzeActor,
): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_AUTHORIZATION,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: StringUtil.trim`
          ## Actor

          \`\`\`json
          ${JSON.stringify(actor)}
          \`\`\`

          ## Prisma Schema

          \`\`\`json
          ${JSON.stringify(ctx.state().prisma?.schemas)}
          \`\`\`

          ## Component Naming Convention

          Please follow this naming convention for the authorization components:

          - Provider Name: ${actor.name}Authorize (e.g. ${actor.name}Authorize)
          - Decorator Name: ${actor.name.charAt(0).toUpperCase() + actor.name.slice(1)}Auth (e.g. ${actor.name.charAt(0).toUpperCase() + actor.name.slice(1)}Auth)
          - Payload Name: ${actor.name.charAt(0).toUpperCase() + actor.name.slice(1)}Payload (e.g. ${actor.name.charAt(0).toUpperCase() + actor.name.slice(1)}Payload)
        `,
      },
    ],
    userMessage: `Create authorization components for ${actor.name} actor please`,
  };
};
