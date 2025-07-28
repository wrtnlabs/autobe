import { IAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeRealizeAuthorization,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";

export const transformRealizeAuthorizationCorrectHistories = (
  ctx: AutoBeContext<ILlmSchema.Model>,
  auth: AutoBeRealizeAuthorization,
  templateFiles: Record<string, string>,
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
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
      text: AutoBeSystemPromptConstant.REALIZE_AUTHORIZATION_CORRECT,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "## Generated TypeScript Code",
        "",
        "```json",
        `${JSON.stringify(
          {
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
          } satisfies Omit<AutoBeRealizeAuthorization, "role">,
          null,
          2,
        )}`,
        "```",
        "",
        "## Prisma Schema",
        "",
        "```json",
        `${JSON.stringify(ctx.state().prisma?.schemas, null, 2)}`,
        "```",
        "",
        "## File Paths",
        "",
        Object.keys(templateFiles)
          .map((path) => `- ${path}`)
          .join("\n"),
        "",
        "## Compile Errors",
        "",
        "Fix the compilation error in the provided code.",
        "",
        "```json",
        JSON.stringify(diagnostics, null, 2),
        "```",
      ].join("\n"),
    },
  ];
};
