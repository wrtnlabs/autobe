import {
  AutoBeRealizeAuthorization,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { IAutoBeRealizeAuthorizationCorrectApplication } from "../structures/IAutoBeRealizeAuthorizationCorrectApplication";

export const transformRealizeAuthorizationCorrectHistory = (props: {
  authorization: AutoBeRealizeAuthorization;
  template: Record<string, string>;
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  preliminary: AutoBePreliminaryController<"databaseSchemas">;
  previousWrite: IAutoBeRealizeAuthorizationCorrectApplication.IWrite | null;
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_AUTHORIZATION_WRITE,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.REALIZE_AUTHORIZATION_CORRECT,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## Generated TypeScript Code

          \`\`\`json
          ${JSON.stringify({
            provider: {
              location: props.authorization.provider.location,
              name: props.authorization.provider.name,
              content: props.authorization.provider.content,
            },
            decorator: {
              location: props.authorization.decorator.location,
              name: props.authorization.decorator.name,
              content: props.authorization.decorator.content,
            },
            payload: {
              location: props.authorization.payload.location,
              name: props.authorization.payload.name,
              content: props.authorization.payload.content,
            },
          } satisfies Omit<AutoBeRealizeAuthorization, "actor">)}
          \`\`\`

          ## File Paths

          ${Object.keys(props.template)
            .map((path) => `- ${path}`)
            .join("\n")}

          ## Compile Errors

          Fix the compilation error in the provided code.

          \`\`\`json
          ${JSON.stringify(props.diagnostics)}
          \`\`\`

          ## Component Naming Convention

          If the name of the component is not correct, please correct it.

          Please follow this naming convention for the authorization components:

          - Provider Name: ${props.authorization.actor.name.toLowerCase()}Authorize (e.g. ${props.authorization.actor.name.toLowerCase()}Authorize)
          - Decorator Name: ${props.authorization.actor.name.charAt(0).toUpperCase() + props.authorization.actor.name.slice(1).toLowerCase()}Auth (e.g. ${props.authorization.actor.name.charAt(0).toUpperCase() + props.authorization.actor.name.slice(1).toLowerCase()}Auth)
          - Payload Name: ${props.authorization.actor.name.charAt(0).toUpperCase() + props.authorization.actor.name.slice(1).toLowerCase()}Payload (e.g. ${props.authorization.actor.name.charAt(0).toUpperCase() + props.authorization.actor.name.slice(1).toLowerCase()}Payload)
        `,
      },
      ...(props.previousWrite !== null
        ? [
            {
              id: v7(),
              created_at: new Date().toISOString(),
              type: "assistantMessage" as const,
              text: StringUtil.trim`
                Previously submitted correction (your last write):

                Error Analysis:
                ${props.previousWrite.error_analysis}

                Solution Guidance:
                ${props.previousWrite.solution_guidance}

                Components:
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
    userMessage:
      "Fix the compile errors in the authorization components please",
  };
};
