import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { getTestExternalDeclarations } from "./compile/getTestExternalDeclarations";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";

export const transformTestCorrectHistories = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  written: IAutoBeTestWriteResult,
  failure: IAutoBeTypeScriptCompileResult.IFailure,
): Promise<
  Array<
    IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
  >
> => {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_WRITE,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: [
        "## Original Code",
        "```typescript",
        written.file.content,
        "```",
        "",
        "## Compile Errors",
        "Fix the compilation error in the provided code.",
        "",
        "```json",
        JSON.stringify(failure.diagnostics),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_CORRECT,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "## Rules",
        "",
        "You are the world's best TypeScript compiler error fixer.",
        "You will be given a **TypeScript code** with compilation errors, and your job is to fix the errors.",
        "",
        "- Follow the base E2E test style strictly. Never use other frameworks like Jest or Mocha.",
        "- Use `TestValidator.equals(...)` and `typia.assert(...)` to verify results.",
        "- Use `api.functional.XXX` for all API calls. These are defined in API Files.",
        "- Use helper functions like `generate_random_xxx(...)` **only if** they already exist in the base test imports.",
        "- Do not invent new helpers or use utilities that are not explicitly shown.",
        "- Keep all tests deterministic and reliable.",
        "",
        "## File References",
        "",
        `The import statements are automatically inserted based on the AST, which provides all necessary types and SDKs required.`,
        `Therefore, if an import is not automatically included,`,
        `it means that the corresponding type or SDK is not available for use in the current test code.`,
        `You must solve the issue using only the provided SDK and types.`,
        "",
        "### API Files",
        "",
        "```typescript",
        JSON.stringify(written.artifacts.sdk),
        "```",
        "",
        "### DTO Files",
        "",
        "```typescript",
        JSON.stringify(written.artifacts.dto),
        "```",
        "",
        "### External Files",
        "",
        "```typescript",
        JSON.stringify(await getTestExternalDeclarations(ctx)),
        "```",
        "",
        "Now Fix the E2E test function based on the given error information.",
        "Only output a single `async function` named `test_api_{...}`. No explanation, no commentary.",
      ].join("\n"),
    },
  ];
};
