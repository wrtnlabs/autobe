import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeAnalyzeRole } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";

export const transformRealizeAuthorizationHistories = <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  role: AutoBeAnalyzeRole,
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
        "```json",
        JSON.stringify(role),
        "```",
        "",
        "## Prisma Schema",
        "",
        JSON.stringify(ctx.state().prisma?.schemas, null, 2),
        "",
        "## Component Naming Convention",
        "",
        "Please follow this naming convention for the authorization components:",
        "",
        `- Provider Name: ${role.name}Authorize (e.g. ${role.name}Authorize)`,
        `- Decorator Name: ${role.name.charAt(0).toUpperCase() + role.name.slice(1)}Auth (e.g. ${role.name.charAt(0).toUpperCase() + role.name.slice(1)}Auth)`,
        `- Payload Name: ${role.name.charAt(0).toUpperCase() + role.name.slice(1)}Payload (e.g. ${role.name.charAt(0).toUpperCase() + role.name.slice(1)}Payload)`,
      ].join("\n"),
    },
  ];
};
