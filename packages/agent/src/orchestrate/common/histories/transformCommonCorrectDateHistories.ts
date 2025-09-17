import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

interface IFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  script: string;
}

/** Transform date correction histories for AI conversation */
export const transformCommonCorrectDateHistories = (
  failures: IFailure[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    id: v7(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: AutoBeSystemPromptConstant.REALIZE_DATE,
  },
  ...failures.map(
    (f, i, array) =>
      ({
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          # ${i === array.length - 1 ? "Latest Date Type Failure" : "Previous Date Type Failure"}
          
          ## Generated TypeScript Code
          \`\`\`typescript
          ${f.script}
          \`\`\`
          
          ## Date-Related Compile Errors
          ${f.diagnostics
            .map((d) => {
              const location = d.file
                ? `[${d.file}${d.start ? `:${d.start}` : ""}]`
                : "[Unknown location]";
              const code = d.code ? `TS${d.code}` : "";
              const messageText = d.messageText || "Date type error";
              return `- ${location} ${code}: ${messageText}`;
            })
            .join("\n")}
          
          ## Required Fixes:
          - Replace all Date type declarations with string & tags.Format<"date-time">
          - Wrap Date objects with toISOStringSafe(value)
          - Check null/undefined BEFORE calling toISOStringSafe (it doesn't accept null)
          - Remove Date variable declarations (const now = new Date() is forbidden)
          - toISOStringSafe requires a parameter - it's not optional
        `,
      }) satisfies IAgenticaHistoryJson.IAssistantMessage,
  ),
];
