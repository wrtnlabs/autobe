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

  // Build a map: line index → list of error messages for that line
  const errorsByLine = new Map<number, string[]>();
  let cursor: number = 0;
  lines.forEach((_, index) => {
    const lineStart = cursor;
    cursor += lines[index]!.length + 1; // +1 for the newline character

    for (const diag of diagnostics) {
      if (diag.start === null || diag.start === undefined) continue;
      if (diag.start >= lineStart && diag.start < cursor) {
        const errorMessage = String(diag.messageText).replace(/\n/g, "\\n");
        if (!errorsByLine.has(index)) {
          errorsByLine.set(index, []);
        }
        errorsByLine.get(index)!.push(errorMessage);
      }
    }
  });

  if (errorsByLine.size === 0) return "";

  // Produce a single annotated code block with all errors inline
  const annotated = lines
    .map((line, index) => {
      const errors = errorsByLine.get(index);
      if (errors == null) return line;
      return errors.reduce((acc, msg) => acc + " // error: " + msg, line);
    })
    .join("\n");

  return StringUtil.trim`
    \`\`\`typescript
    ${annotated}
    \`\`\`
  `;
}
