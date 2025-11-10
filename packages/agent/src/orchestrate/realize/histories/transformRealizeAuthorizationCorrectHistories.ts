import {
  AutoBeRealizeAuthorization,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";

export const transformRealizeAuthorizationCorrectHistories = <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  auth: AutoBeRealizeAuthorization,
  templateFiles: Record<string, string>,
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
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
        text: AutoBeSystemPromptConstant.REALIZE_AUTHORIZATION_CORRECT,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## Generated TypeScript Code

          \`\`\`json
          ${JSON.stringify({
            provider: {
              location: auth.provider.location,
              name: auth.provider.name,
              content: auth.provider.content,
            },
            decorator: {
              location: auth.decorator.location,
              name: auth.decorator.name,
              content: auth.decorator.content,
            },
            payload: {
              location: auth.payload.location,
              name: auth.payload.name,
              content: auth.payload.content,
            },
          } satisfies Omit<AutoBeRealizeAuthorization, "actor">)}
          \`\`\`

          ## Prisma Schema

          \`\`\`json
          ${JSON.stringify(ctx.state().prisma?.schemas)}
          \`\`\`

          ## File Paths

          ${Object.keys(templateFiles)
            .map((path) => `- ${path}`)
            .join("\n")}

          ## Compile Errors

          Fix the compilation error in the provided code.

          \`\`\`json
          ${JSON.stringify(diagnostics)}
          \`\`\`

          ## Component Naming Convention

          If the name of the component is not correct, please correct it.

          Please follow this naming convention for the authorization components:

          - Provider Name: ${auth.actor.name.toLowerCase()}Authorize (e.g. ${auth.actor.name.toLowerCase()}Authorize)
          - Decorator Name: ${auth.actor.name.charAt(0).toUpperCase() + auth.actor.name.slice(1).toLowerCase()}Auth (e.g. ${auth.actor.name.charAt(0).toUpperCase() + auth.actor.name.slice(1).toLowerCase()}Auth)
          - Payload Name: ${auth.actor.name.charAt(0).toUpperCase() + auth.actor.name.slice(1).toLowerCase()}Payload (e.g. ${auth.actor.name.charAt(0).toUpperCase() + auth.actor.name.slice(1).toLowerCase()}Payload)
        `,
      },
    ],
    userMessage:
      "Fix the compile errors in the authorization components please",
  };
};
