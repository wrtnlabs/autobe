import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeInterfaceAuthorization, AutoBeOpenApi } from "@autobe/interface";
import { MapUtil, StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeTestScenarioAuthorizationRole } from "../structures/IAutoBeTestScenarioAuthorizationRole";
import { getReferenceIds } from "../utils/getReferenceIds";

export const transformTestScenarioHistories = (props: {
  state: AutoBeState;
  document: AutoBeOpenApi.IDocument;
  include: AutoBeOpenApi.IOperation[];
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[];
  instruction: string;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  interface IRelationship {
    endpoint: AutoBeOpenApi.IEndpoint;
    ids: string[];
  }
  const authorizations: AutoBeInterfaceAuthorization[] =
    props.state.interface?.authorizations ?? [];
  const authorizationRoles: Map<string, IAutoBeTestScenarioAuthorizationRole> =
    new Map();
  const relationships: IRelationship[] = props.document.operations
    .map((operation) => ({
      endpoint: {
        method: operation.method,
        path: operation.path,
      },
      ids: getReferenceIds({
        document: props.document,
        operation,
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
        ## Instructions

        The following e2e-test-specific instructions were extracted by AI from
        the user's requirements and conversations. These instructions focus
        exclusively on test-related aspects such as test coverage priorities,
        specific edge cases to validate, business logic verification strategies,
        and critical user workflows that must be tested.
        
        Apply these instructions when generating test scenarios to ensure the
        tests align with the user's testing requirements and expectations.
        If any instructions are not relevant to the target API operations,
        you may ignore them.

        ${props.instruction}

        ## API Operations

        Below are the complete API operations.
        Use this information to understand capabilities and dependency relationships.
        Generate scenarios only for endpoints listed in "Included in Test Plan".
        Other operations may be referenced as dependencies only.

        You may write multiple scenarios for a single included endpoint.
        Focus on business-logic-oriented E2E flows rather than trivial CRUD.

        Please analyze the operations to identify all dependencies required for testing.
        Pay close attention to IDs and related values in the API,
        and ensure you identify all dependencies between endpoints.

        \`\`\`json
        ${JSON.stringify({
          operations: props.document.operations,
        })}
        \`\`\`

        ## Included in Test Plan

        Below are the endpoints that have been included in the test plan.
        Each endpoint shows its authentication requirements and related authentication APIs.
        When testing endpoints that require authentication, ensure you include the corresponding 
        join/login operations in your test scenario to establish proper authentication context.

        Generate test scenarios only for these included endpoints. Do not create scenarios for excluded endpoints. Operations not listed here may be used only as dependencies.

        ${props.include
          .map((el, i) => {
            const roles = Array.from(authorizationRoles.values()).filter(
              (role) => role.name === el.authorizationRole,
            );

            const requiredIds = getReferenceIds({
              document: props.document,
              operation: el,
            });
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

              Required IDs:
              
              - ${
                requiredIds.length > 0
                  ? requiredIds.map((id) => `\`${id}\``).join(", ")
                  : "None"
              }
            `;
          })
          .join("\n")}

        ## Excluded from Test Plan

        These are the endpoints that have already been used in test codes generated as part of a plan group.
        These endpoints do not need to be tested again.
        However, it is allowed to reference or depend on these endpoints when writing test codes for other purposes.

        ${props.exclude
          .map((el) => `- ${el.method.toUpperCase()}: ${el.path}`)
          .join("\n")}

        ## Candidate Dependencies
    
        List of candidate dependencies extracted from path parameters and request bodies.

        Apply dependency resolution to the target endpoint from "Included in Test Plan" and to dependencies found recursively from it.
        For each required ID, locate the operation that creates the resource. Include the creator only if that operation exists in the provided operations list. Do not assume or invent operations. If no creator exists, treat the ID as an external or pre-existing input.

        Dependency resolution steps:
        1. Starting from the target endpoint, collect required IDs.
        2. For each ID, search for a creator operation (typically POST).
        3. If found, add it to the dependency chain in execution order and repeat for its own required IDs.
        4. Stop when no further creators exist or are needed.

        For each some_entity_id pattern, use the same approach: include a creator only when it is present in the operations list.
    
        Endpoint | Required IDs (MUST be created by other APIs)
        ---------|---------------------------------------------------
        ${relationships
          .map((r) =>
            [
              `\`${r.endpoint.method} ${r.endpoint.path}\``,
              r.ids.map((id) => `\`${id}\``).join(", "),
            ].join(" | "),
          )
          .join("\n")}

        Example: If an endpoint requires \`articleId\` and \`POST /articles\` exists, include it in dependencies
      `,
    } satisfies IAgenticaHistoryJson.IAssistantMessage,
  ];
};
