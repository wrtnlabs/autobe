import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformTestScenarioHistories = (
  entire: AutoBeOpenApi.IOperation[],
  include: AutoBeOpenApi.IOperation[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
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
      "Below are the full operations. Please refer to this.",
      "Your role is to draft all test cases for each given Operation.",
      "It is also permissible to write multiple test codes on a single endpoint.",
      "However, rather than meaningless tests, business logic tests should be written and an E2E test situation should be assumed.",
      "",
      "Please carefully analyze each operation to identify all dependencies required for testing.",
      "For example, if you want to test liking and then deleting a post,",
      "you might think to test post creation, liking, and unlike operations.",
      "However, even if not explicitly mentioned, user registration and login are essential prerequisites.",
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
  {
    id: v4(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: [
      "# Included in Test Plan",
      include
        .map(
          (el) =>
            `- ${el.method.toUpperCase()}: ${el.path} ${el.authorizationRole ? `(Role: ${el.authorizationRole})` : ""}`,
        )
        .join("\n"),
      "",
      "# Excluded from Test Plan",
      "These are the endpoints that have already been used in test codes generated as part of a plan group.",
      "These endpoints do not need to be tested again.",
      "However, it is allowed to reference or depend on these endpoints when writing test codes for other purposes.",
      exclude
        .map((el) => `- ${el.method.toUpperCase()}: ${el.path}`)
        .join("\n"),
    ].join("\n"),
  } satisfies IAgenticaHistoryJson.ISystemMessage,
];
