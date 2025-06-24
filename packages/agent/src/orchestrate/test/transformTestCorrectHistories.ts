import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";

export const transformTestCorrectHistories = (
  document: AutoBeOpenApi.IDocument | null,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_CORRECT,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "You are the world's best TypeScript compiler error fixer.",
        "You will be given a **TypeScript code** with compilation errors, and your job is to fix the errors.",
        "",
        "## Rules",
        "- Follow the base E2E test style strictly. Never use other frameworks like Jest or Mocha.",
        "- Use `TestValidator.equals(...)` and `typia.assert(...)` to verify results.",
        "- Use `api.functional.XXX` for all API calls. These are defined in API Files.",
        "- Use helper functions like `generate_random_xxx(...)` **only if** they already exist in the base test imports.",
        "- Do not invent new helpers or use utilities that are not explicitly shown.",
        "- Keep all tests deterministic and reliable.",
        "",
        "## File References",
        "### OpenAPI Like Document",
        "```json",
        JSON.stringify(document),
        "```",
        // "### API Files",
        // "```typescript",
        // JSON.stringify(apiFiles, null, 2),
        // "```",
        // "",
        // "### DTO Files",
        // "```typescript",
        // JSON.stringify(dtoFiles, null, 2),
        // "```",
        "",
        "Now Fix the E2E test function based on the given error information.",
        "Only output a single `async function` named `test_api_{...}`. No explanation, no commentary.",
      ].join("\n"),
    },
  ];
};
