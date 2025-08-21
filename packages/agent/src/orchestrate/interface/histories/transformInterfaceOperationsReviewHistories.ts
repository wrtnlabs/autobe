import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export function transformInterfaceOperationsReviewHistories<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
): Array<IMicroAgenticaHistoryJson> {
  return [
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_OPERATION,
    },
    ...transformInterfaceAssetHistories(ctx.state()),
    {
      type: "systemMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: AutoBeSystemPromptConstant.INTERFACE_OPERATION_REVIEW,
    },
    {
      type: "assistantMessage",
      id: v4(),
      created_at: new Date().toISOString(),
      text: [
        "Review the following API operations:",
        "",
        "```json",
        JSON.stringify(operations),
        "```",
      ].join("\n"),
    },
  ];
}
