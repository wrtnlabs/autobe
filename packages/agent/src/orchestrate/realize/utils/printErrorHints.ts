import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

/**
 * Prints error hints for a given code and its diagnostics.
 *
 * @param code The code to analyze.
 * @param diagnostics The diagnostics to use for error hinting.
 */
export function printErrorHints(
  code: string,
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): string {
  const lines: string[] = code.split("\n");

  let cursor: number = 0;
  const hints: string[] = [];
  lines.forEach((line, index, arr) => {
    const lineStart = cursor;
    cursor += line.length + 1; // +1 for the newline character

    diagnostics.forEach((diag) => {
      if (diag.start === null || diag.start === undefined) {
        return;
      }

      // Check if the diagnostic start position falls within the current line
      if (diag.start >= lineStart && diag.start < cursor) {
        // Handle multi-line error messages by escaping newlines
        const errorMessage = String(diag.messageText).replace(/\n/g, "\\n");
        const targetLine = line + " // error: " + errorMessage;

        // targetLine만 덮어써서 새로운 배열을 만들어야 한다.
        const hint: string = arr
          .slice(0, index)
          .concat(targetLine)
          .concat(arr.slice(index + 1))
          .join("\n");

        hints.push(hint);
      }
    });
  });

  return hints
    .map((h, i) => {
      return StringUtil.trim`
        hint #${i + 1}:
        \`\`\`typescript
        ${h}
        \`\`\`
      `;
    })
    .join("\n\n");
}
