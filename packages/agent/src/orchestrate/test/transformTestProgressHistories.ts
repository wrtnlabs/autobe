import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";

export const transformTestProgressHistories = (
  document: AutoBeOpenApi.IDocument,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_PROGRESS,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "You are the world's best E2E test code generator.",
        "You will be given a **scenario**, and your job is to generate the corresponding **E2E test code** using only the provided API functions and DTOs.",
        "",
        "## Rules",
        "- Follow the base E2E test style strictly. Never use other frameworks like Jest or Mocha.",
        "- Use `TestValidator.equals(...)` and `typia.assert(...)` to verify results.",
        "- Use `HubApi.functional.XXX` for all API calls. These are defined in API Files.",
        "- Use helper functions like `generate_random_xxx(...)` **only if** they already exist in the base test imports.",
        "- Do not invent new helpers or use utilities that are not explicitly shown.",
        "- Keep all tests deterministic and reliable.",
        "",
        "## OpenAPI Like Document",
        "```json",
        JSON.stringify(document),
        "```",
        "",
        "Here is the OpenAPI like document only about the API functions and DTOs",
        "related to the scenario. Use all of them to generate the E2E test code.",
        "",
        "Now generate the E2E test function based on the given scenario.",
        "",
        "Only output a single `async function` named `test_api_{...}`. No explanation, no commentary.",
      ].join("\n"),
    },
  ];
};
