import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { MapUtil } from "@autobe/utils";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformTestScenarioHistories = (
  entire: AutoBeOpenApi.IOperation[],
  include: AutoBeOpenApi.IOperation[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  interface IAuthorizationRole {
    role: string;
    join: AutoBeOpenApi.IOperation | null;
    login: AutoBeOpenApi.IOperation | null;
  }
  const authorizationRoles: Map<string, IAuthorizationRole> = new Map();
  for (const op of entire) {
    if (op.authorizationRole === null) continue;
    const value: IAuthorizationRole = MapUtil.take(
      authorizationRoles,
      op.authorizationRole,
      () => ({
        role: op.authorizationRole!,
        join: null,
        login: null,
      }),
    );
    if (op.authorizationType === "join") value.join = op;
    else if (op.authorizationType === "login") value.login = op;
  }
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_SCENARIO,
    } satisfies IAgenticaHistoryJson.ISystemMessage,
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Operations",
        "",
        "Below are the full operations. Please refer to this.",
        "Your role is to draft all test cases for each given Operation.",
        "It is also permissible to write multiple test codes on a single endpoint.",
        "However, rather than meaningless tests, business logic tests should be written and an E2E test situation should be assumed.",
        "",
        "Please carefully analyze each operation to identify all dependencies required for testing.",
        "For example, if you want to test liking and then deleting a post,",
        "you might think to test post creation, liking, and unlike operations.",
        "However, even if not explicitly mentioned, user registration or login are essential prerequisites.",
        "Pay close attention to IDs and related values in the API,",
        "and ensure you identify all dependencies between endpoints.",
        "",
        "```json",
        JSON.stringify(
          entire.map((el) => ({
            ...el,
            specification: undefined,
          })),
        ),
        "```",
      ].join("\n"),
    } satisfies IAgenticaHistoryJson.ISystemMessage,
    ...(authorizationRoles.size > 0
      ? [
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "systemMessage",
            text: [
              "# Authentication Information",
              "",
              "## Authentication Operations",
              "",
              "Below are the authentication-related operations available in the system:",
              "",
              "### Join Operations (User Registration)",
              "",
              joinOperations
                .map(
                  (op) =>
                    `- ${op.method.toUpperCase()}: ${op.path} ${op.authorizationRole ? `(Role: ${op.authorizationRole})` : ""}`,
                )
                .join("\n") || "- No join operations available",
              "",
              "### Login Operations (User Authentication)",
              "",
              loginOperations
                .map(
                  (op) =>
                    `- ${op.method.toUpperCase()}: ${op.path} ${op.authorizationRole ? `(Role: ${op.authorizationRole})` : ""}`,
                )
                .join("\n") || "- No login operations available",
              "",
              "## Important Notes",
              "",
              "1. When testing operations that require authentication (authorizationRole is set), you MUST include the corresponding 'join' operation in the test scenario to create the user first.",
              "2. If your test scenario involves multiple actors with different roles, include both 'join' and 'login' operations for role switching.",
              "3. Always establish the authentication context before testing protected endpoints.",
              "4. Consider the authentication flow: ",
              "- If the scenario includes actions for a **single role**, use only `join`. ",
              "- If the scenario includes **multiple roles**, use both `join` and `login` for proper role switching. ",
            ].join("\n"),
          } satisfies IAgenticaHistoryJson.ISystemMessage,
        ]
      : []),
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Included in Test Plan",
        "",
        "Below are the endpoints that have been included in the test plan.",
        "Each endpoint shows its authentication requirements and related authentication APIs.",
        "When testing endpoints that require authentication, ensure you include the corresponding join/login operations in your test scenario to establish proper authentication context.",
        "",
        include
          .map((el, i) => {
            const authOperations = joinOperations.filter(
              (op) => el.authorizationRole === op.authorizationRole,
            );
            return [
              `${i + 1}. ${el.method.toUpperCase()}: ${el.path}:`,
              `- Related Authentication API (Role: ${el.authorizationRole})${el.authorizationRole ? `: ${authOperations.map((op) => `${op.method.toUpperCase()}: ${op.path}`).join(", ")}` : ": None"}`,
            ].join("\n");
          })
          .join("\n"),
        "",
        "# Excluded from Test Plan",
        "",
        "These are the endpoints that have already been used in test codes generated as part of a plan group.",
        "These endpoints do not need to be tested again.",
        "However, it is allowed to reference or depend on these endpoints when writing test codes for other purposes.",
        exclude
          .map((el) => `- ${el.method.toUpperCase()}: ${el.path}`)
          .join("\n"),
      ].join("\n"),
    } satisfies IAgenticaHistoryJson.ISystemMessage,
  ];
};
