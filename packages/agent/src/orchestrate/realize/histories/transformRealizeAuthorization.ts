import { IAgenticaHistoryJson } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";

export const transformRealizeAuthorizationHistories = <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  role: string,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_AUTHORIZATION,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "## Role",
        "",
        role,
        "",
        "## Prisma Schema",
        "",
        JSON.stringify(ctx.state().prisma?.schemas, null, 2),
        "",
        "## Component Naming Convention",
        "",
        "Please follow this naming convention for the authorization components:",
        "",
        `- Provider Name: ${role}Authorize (e.g. ${role}Authorize)`,
        `- Decorator Name: ${role.charAt(0).toUpperCase() + role.slice(1)}Auth (e.g. ${role.charAt(0).toUpperCase() + role.slice(1)}Auth)`,
        `- Payload Name: ${role.charAt(0).toUpperCase() + role.slice(1)}Payload (e.g. ${role.charAt(0).toUpperCase() + role.slice(1)}Payload)`,
      ].join("\n"),
    },
  ];
};
