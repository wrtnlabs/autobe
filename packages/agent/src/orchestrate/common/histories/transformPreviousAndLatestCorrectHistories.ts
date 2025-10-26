import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { printErrorHints } from "../../realize/utils/printErrorHints";

export const transformPreviousAndLatestCorrectHistories = (
  array: Array<{
    script: string;
    diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  }>,
): IAgenticaHistoryJson.IAssistantMessage[] =>
  array.map((failure, i) => ({
    id: v7(),
    type: "assistantMessage",
    text: StringUtil.trim`
      ${
        i === array.length - 1
          ? "# Latest Failure"
          : StringUtil.trim`
            # Previous Failure

            This is the previous failure for your reference.

            Never try to fix this previous failure code, but only
            focus on the latest failure below. This is provided just
            to give you context about your past mistakes.

            If same mistake happens again, you must try to not
            repeat the same mistake. Change your approach to fix
            the issue.
          `
      }
      
      ## Original Code

      Here is the previous code you have to review and fix.

      \`\`\`typescript
      ${failure.script}
      \`\`\`

      ## Compilation Errors

      Here are the compilation errors found in the code above.

      \`\`\`json
      ${JSON.stringify(failure.diagnostics)}
      \`\`\`

      ## Error Annotated Code

      Here is the error annotated code.

      Please refer to the annotation for the location of the error.

      By the way, note that, this code is only for reference purpose.
      Never fix code from this error annotated code. You must fix
      the original code above.

      ${printErrorHints(failure.script, failure.diagnostics)}
    `,
    created_at: new Date().toISOString(),
  }));
