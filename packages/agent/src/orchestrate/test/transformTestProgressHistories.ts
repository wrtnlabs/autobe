import { IAgenticaHistoryJson } from "@agentica/core";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";

export const transformTestProgressHistories = (
  apiFiles: Record<string, string>,
  dtoFiles: Record<string, string>,
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
        "You will be given **scenarios**, and your job is to generate the corresponding **E2E test codes** using only the provided API functions and DTOs.",
        "",
        "## Rules",
        "- Follow the base E2E test style strictly. Never use other frameworks like Jest or Mocha.",
        "- Use `TestValidator.equals(...)` and `typia.assert(...)` to verify results.",
        "- Use `api.functional.XXX` for all API calls. These are defined in API Files.",
        '- Import API using `import api from "@ORGANIZATION/PROJECT-api";`',
        '- Import DTO types using exact paths: `import { ITypeName } from "@ORGANIZATION/PROJECT-api/lib/structures/[exact-path]";`',
        "- Only use API functions and DTO types that are explicitly provided in the files.",
        "- Keep all tests deterministic and reliable.",
        "- Each test code should be complete and self-contained (max 300 lines per test).",
        "",
        "## File References",
        "### API Files",
        "```typescript",
        JSON.stringify(apiFiles, null, 2),
        "```",
        "",
        "### DTO Files",
        "```typescript",
        JSON.stringify(dtoFiles, null, 2),
        "```",
        "",
        "Now generate multiple E2E test codes based on the given scenarios.",
        "Each test code must contain a single async function named `test_api_{...}` that covers a specific aspect of the scenario.",
      ].join("\n"),
    },
  ];
};
