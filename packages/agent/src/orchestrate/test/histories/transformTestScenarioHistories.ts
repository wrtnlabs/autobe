import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeInterfaceAuthorization, AutoBeOpenApi } from "@autobe/interface";
import { MapUtil, StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeTestScenarioAuthorizationRole } from "../structures/IAutoBeTestScenarioAuthorizationRole";
import { getPrerequisites } from "../utils/getPrerequisites";

export const transformTestScenarioHistories = (props: {
  state: AutoBeState;
  document: AutoBeOpenApi.IDocument;
  include: AutoBeOpenApi.IOperation[];
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[];
  instruction: string;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const authorizations: AutoBeInterfaceAuthorization[] =
    props.state.interface?.authorizations ?? [];
  const authorizationRoles: Map<string, IAutoBeTestScenarioAuthorizationRole> =
    new Map();

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
        If any instructions are relevant to the target API operations,
        you MUST follow them exactly without arbitrary judgment.
        DO NOT make your own decisions even if you think you have better ideas.
        Only ignore instructions that are completely unrelated to the target
        API operations.

        ${props.instruction}

        ## API Operations

        Below are the complete API operations.
        Use this information to understand capabilities and dependency relationships.
        Generate scenarios only for endpoints listed in "Included in Test Plan".
        Other operations may be referenced as dependencies only.

        You may write multiple scenarios for a single included endpoint.
        Focus on business-logic-oriented E2E flows rather than trivial CRUD.

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

        \`\`\`json
        ${JSON.stringify(
          props.include.map((el) => ({
            ...el,
            prerequisites: getPrerequisites({
              document: props.document,
              endpoint: el,
            }),
            authorizationRoles: Array.from(authorizationRoles.values()).filter(
              (role) => role.name === el.authorizationRole,
            ),
          })),
        )}
        \`\`\`

        ## Excluded from Test Plan

        These are the endpoints that have already been used in test codes generated as part of a plan group.
        These endpoints do not need to be tested again.
        However, it is allowed to reference or depend on these endpoints when writing test codes for other purposes.

        \`\`\`json
        ${JSON.stringify(props.exclude)}
        \`\`\`

      `,
    } satisfies IAgenticaHistoryJson.IAssistantMessage,
  ];
};
