import { IAgenticaHistoryJson } from "@agentica/core";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";

export const transformTestCorrectHistories = (props: {
  dto: Record<string, string>;
  sdk: Record<string, string>;
  e2e: Record<string, string>;
}): Array<
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
        "- Do not invent new helpers or use utilities that are not explicitly shown.",
        "- Keep all tests deterministic and reliable.",
        "",
        "## DTO Definitions",
        "```json",
        JSON.stringify(props.dto),
        "```",
        "",
        "## API (SDK) Functions",
        "```json",
        JSON.stringify(props.sdk),
        "```",
        "",
        "## E2E Mockup Functions",
        "```json",
        JSON.stringify(props.e2e),
        "```",
        "",
        "```",
        "",
        "Now Fix the E2E test function based on the given error information.",
        "Only output a single `async function` named `test_api_{...}`. No explanation, no commentary.",
      ].join("\n"),
    },
  ];
};
