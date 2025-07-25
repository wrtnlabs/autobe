import { IAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeRealizeAuthorization,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeRealizeDecoratorApplication } from "./structures/IAutoBeRealizeDecoratorApplication";

export const transformRealizeDecoratorCorrectHistories = (
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
      text: AutoBeSystemPromptConstant.REALIZE_DECORATOR_CORRECT,
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
              name: auth.provider.name,
              code: auth.provider.content,
            },
            decorator: {
              name: auth.decorator.name,
              code: auth.decorator.content,
            },
            payload: {
              name: auth.payload.name,
              code: auth.payload.content,
            },
          } satisfies IAutoBeRealizeDecoratorApplication.IProps,
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
