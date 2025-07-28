import { IAgenticaHistoryJson } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AuthorizationFileSystem } from "./utils/AuthorizationFileSystem";

export const transformRealizeAuthorizationHistories = (
  ctx: AutoBeContext<ILlmSchema.Model>,
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
        "## File Structure Example",
        "",
        "Please refer to the following file structure to construct appropriate import paths:",
        "",
        "File locations:",
        "",
        `- Decorator Path : ${AuthorizationFileSystem.decoratorPath("AdminAuth.ts")}`,
        `- Payload Path : ${AuthorizationFileSystem.payloadPath("AdminPayload.ts")}`,
        `- Provider Path : ${AuthorizationFileSystem.providerPath("adminAuthorize.ts")}`,
        "",
      ].join("\n"),
    },
  ];
};
