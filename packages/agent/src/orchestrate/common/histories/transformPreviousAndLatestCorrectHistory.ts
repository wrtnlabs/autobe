import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import {
  extractDidYouMeanHints,
  generateMissingPropertyHints,
  generateTS2339Hints,
} from "../../realize/utils/generateTS2339Hints";
import { printErrorHints } from "../../realize/utils/printErrorHints";

export const transformPreviousAndLatestCorrectHistory = (
  array: Array<{
    script: string;
    diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  }>,
): IAgenticaHistoryJson.IAssistantMessage[] => {
  // P2-3: Summarize older failures when there are 3+ attempts
  // Keep last 2 in full, summarize the rest
  const summarized = summarizeOlderFailures(array);

  return summarized.map((failure, i) => {
    const isLatest = i === summarized.length - 1;
    const ts2339Hints = isLatest
      ? generateTS2339Hints(failure.diagnostics)
      : "";
    const missingPropHints = isLatest
      ? generateMissingPropertyHints(failure.diagnostics)
      : "";
    const didYouMeanHints = isLatest
      ? extractDidYouMeanHints(failure.diagnostics)
      : [];
    const didYouMeanSection =
      didYouMeanHints.length > 0
        ? [
            "",
            "## ⚠ MANDATORY Name Corrections (from compiler)",
            "",
            "The compiler matched these names against the actual schema and identified the correct spelling.",
            "Apply every correction below FIRST — before analyzing other errors. A single misspelled name",
            "cascades into many downstream errors, so these renames alone may resolve most diagnostics.",
            "",
            ...didYouMeanHints.map(
              (h) =>
                `- **\`${h.wrong}\`** → **\`${h.suggested}\`** (rename every occurrence in the entire file)`,
            ),
          ].join("\n")
        : "";

    return {
      id: v7(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ${
          isLatest
            ? "# Latest Failure"
            : failure.script === ""
              ? StringUtil.trim`
                # Summary of Earlier Failures

                ${failure.diagnostics[0]?.messageText ?? "Multiple earlier correction attempts failed."}

                Focus on the latest failure below and try a DIFFERENT approach.
              `
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

        ${
          failure.script !== ""
            ? StringUtil.trim`
              ${didYouMeanSection}

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

              ${ts2339Hints}

              ${missingPropHints}
            `
            : ""
        }
      `,
      created_at: new Date().toISOString(),
    };
  });
};

/**
 * P2-3: When there are 3+ failure attempts, summarize the older ones to prevent
 * context bloat. Keep the last 2 in full, collapse the rest into a single
 * summary entry.
 */
const summarizeOlderFailures = (
  array: Array<{
    script: string;
    diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  }>,
): Array<{
  script: string;
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
}> => {
  if (array.length <= 2) return array;

  const olderCount = array.length - 2;
  const olderDiagCount = array
    .slice(0, -2)
    .reduce((sum, f) => sum + f.diagnostics.length, 0);

  const summary: {
    script: string;
    diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  } = {
    script: "",
    diagnostics: [
      {
        file: array[0]!.diagnostics[0]?.file ?? null,
        start: null,
        length: null,
        code: 0,
        messageText:
          `[Summary of ${olderCount} previous correction attempts with ` +
          `${olderDiagCount} total errors. The same fixes were attempted but ` +
          `failed. Focus on the latest diagnostics below and try a DIFFERENT approach.]`,
        category: "error",
      },
    ],
  };

  return [summary, ...array.slice(-2)];
};
