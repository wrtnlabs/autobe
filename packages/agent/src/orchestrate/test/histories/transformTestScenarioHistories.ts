import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeInterfaceAuthorization, AutoBeOpenApi } from "@autobe/interface";
import { MapUtil, StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeTestScenarioAuthorizationRole } from "../structures/IAutoBeTestScenarioAuthorizationRole";
import { getReferenceIds } from "../utils/getReferenceIds";

export const transformTestScenarioHistories = (
  state: AutoBeState,
  document: AutoBeOpenApi.IDocument,
  include: AutoBeOpenApi.IOperation[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  interface IRelationship {
    endpoint: AutoBeOpenApi.IEndpoint;
    ids: string[];
  }
  const authorizations: AutoBeInterfaceAuthorization[] =
    state.interface?.authorizations ?? [];
  const authorizationRoles: Map<string, IAutoBeTestScenarioAuthorizationRole> =
    new Map();
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

  for (const authorization of authorizations) {
    for (const op of authorization.operations) {
      if (op.authorizationType === null) continue;
      const value: IAutoBeTestScenarioAuthorizationRole = MapUtil.take(
        authorizationRoles,
        authorization.role,
        () => ({
          name: authorization.role,
          join: null,
          login: null,
        }),
      );
      if (op.authorizationType === "join") value.join = op;
      else if (op.authorizationType === "login") value.login = op;
    }
  }

  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_SCENARIO,
    } satisfies IAgenticaHistoryJson.ISystemMessage,
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        # Operations

        Below are the complete API operations with their corresponding schema definitions. 
        This information is critical for understanding API capabilities, data structures, and dependency relationships.
        Your role is to draft comprehensive test cases for each given Operation using both the operation definitions and schema structures.
        It is also permissible to write multiple test codes on a single endpoint.
        However, rather than meaningless tests, business logic tests should be written and an E2E test situation should be assumed.

        Please carefully analyze each operation and schema to identify all dependencies required for testing.
        Pay close attention to IDs and related values in the API,
        and ensure you identify all dependencies between endpoints.

        \`\`\`json
        ${JSON.stringify({ operations: document.operations, schemas: document.components.schemas })}
        \`\`\`
      `,
    } satisfies IAgenticaHistoryJson.IAssistantMessage,
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        # Included in Test Plan

        Below are the endpoints that have been included in the test plan.
        Each endpoint shows its authentication requirements and related authentication APIs.
        When testing endpoints that require authentication, ensure you include the corresponding 
        join/login operations in your test scenario to establish proper authentication context.

        ${include
          .map((el, i) => {
            const roles = Array.from(authorizationRoles.values()).filter(
              (role) => role.name === el.authorizationRole,
            );
            return StringUtil.trim`
              ## ${i + 1}. ${el.method.toUpperCase()} ${el.path}

              Related Authentication APIs:

              ${
                roles.length > 0
                  ? roles
                      .map((role) => {
                        return StringUtil.trim`
                          - ${role.join?.method.toUpperCase()}: ${role.join?.path}
                          - ${role.login?.method.toUpperCase()}: ${role.login?.path}
                        `;
                      })
                      .join("\n")
                  : "- None"
              }
            `;
          })
          .join("\n")}

        # Excluded from Test Plan

        These are the endpoints that have already been used in test codes generated as part of a plan group.
        These endpoints do not need to be tested again.
        However, it is allowed to reference or depend on these endpoints when writing test codes for other purposes.

        ${exclude
          .map((el) => `- ${el.method.toUpperCase()}: ${el.path}`)
          .join("\n")}
      `,
    } satisfies IAgenticaHistoryJson.IAssistantMessage,
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
};
