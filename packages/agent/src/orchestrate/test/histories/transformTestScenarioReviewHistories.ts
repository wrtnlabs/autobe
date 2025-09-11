import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeTestScenarioApplication } from "../structures/IAutoBeTestScenarioApplication";
import { getReferenceIds } from "../utils/getReferenceIds";

export function transformTestScenarioReviewHistories<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[],
): Array<
  IAgenticaHistoryJson.ISystemMessage | IAgenticaHistoryJson.IAssistantMessage
> {
  interface IRelationship {
    endpoint: AutoBeOpenApi.IEndpoint;
    ids: string[];
  }

  const document: AutoBeOpenApi.IDocument | undefined =
    ctx.state().interface?.document;

  if (document === undefined) {
    throw new Error(
      "Cannot review test scenarios because there are no operations.",
    );
  }

  const relationships: IRelationship[] = document.operations
    .map((o) => ({
      endpoint: {
        method: o.method,
        path: o.path,
      },
      ids: getReferenceIds({
        document,
        operation: o,
      }),
    }))
    .filter((v) => v.ids.length !== 0);

  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_SCENARIO_REVIEW,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        # Available API Operations for Reference

        Below are all available API operations and interface schemas for validation purposes.
        Match each operation with its corresponding schema.

        \`\`\`json
        ${JSON.stringify({ operations: document.operations, schemas: document.components.schemas })}
        \`\`\`
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Please review the following test scenario groups:

        \`\`\`json
        ${JSON.stringify(groups)}
        \`\`\`
      `,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        # Candidate Dependencies
    
        Here is the list of candidate dependencies identified across 
        all operations by analyzing path parameters and request bodies.
    
        **CRITICAL**: Each ID listed below represents a resource that MUST exist before the operation can execute.
        You MUST identify and include the API operations that create these resources in your test scenario dependencies.
    
        For each \`some_entity_id\` pattern identified, you are REQUIRED to:
        1. Find the API operation that creates that entity (has the ID in responseIds)
        2. Include that operation in your dependency chain
        3. Ensure proper execution order based on dependency relationships
    
        Endpoint | Required IDs (MUST be created by other APIs)
        ---------|---------------------------------------------------
        ${relationships
          .map((r) =>
            [
              `\`${r.endpoint.method} ${r.endpoint.path}\``,
              r.ids.map((id) => `\`${id}\``).join(", "),
            ].join(" | "),
          )
          .join("\n")}.
    
        **Example**: If an endpoint requires \`articleId\`, you MUST include the API that creates articles (e.g., \`POST /articles\`) in your dependencies.
      `,
    } satisfies IAgenticaHistoryJson.IAssistantMessage,
  ];
}
