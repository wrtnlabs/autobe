import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeInterfaceAuthorization, AutoBeOpenApi } from "@autobe/interface";
import { MapUtil, StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeTestScenarioAuthorizationRole } from "../structures/IAutoBeTestScenarioAuthorizationRole";

export const transformTestScenarioHistories = (
  state: AutoBeState,
  entire: AutoBeOpenApi.IOperation[],
  include: AutoBeOpenApi.IOperation[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const authorizations: AutoBeInterfaceAuthorization[] =
    state.interface?.authorizations ?? [];

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
      type: "systemMessage",
      text: StringUtil.trim`
        # Operations

        Below are the full operations. Please refer to this.
        Your role is to draft all test cases for each given Operation.
        It is also permissible to write multiple test codes on a single endpoint.
        However, rather than meaningless tests, business logic tests should be written and an E2E test situation should be assumed.

        Please carefully analyze each operation to identify all dependencies required for testing.
        For example, if you want to test liking and then deleting a post,
        you might think to test post creation, liking, and unlike operations.
        However, even if not explicitly mentioned, user registration or login are essential prerequisites.
        Pay close attention to IDs and related values in the API,
        and ensure you identify all dependencies between endpoints.

        \`\`\`json
        ${JSON.stringify(
          entire.map((el) => ({
            ...el,
            specification: undefined,
          })),
        )}
        \`\`\`
      `,
    } satisfies IAgenticaHistoryJson.ISystemMessage,
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: StringUtil.trim`
        # Included in Test Plan

        Below are the endpoints that have been included in the test plan.
        Each endpoint shows its authentication requirements and related authentication APIs.
        When testing endpoints that require authentication, ensure you include the corresponding join/login operations in your test scenario to establish proper authentication context.

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
    } satisfies IAgenticaHistoryJson.ISystemMessage,
  ];
};
