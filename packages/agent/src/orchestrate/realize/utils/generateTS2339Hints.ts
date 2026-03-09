import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";

/**
 * Generates concise TS2339-specific hints for Prisma relation field access
 * errors.
 *
 * Parses TS2339 "Property 'X' does not exist on type 'Y'" diagnostics,
 * deduplicates by (property, type) pair, and returns a short explanation when Y
 * appears to be a Prisma model type (snake_case naming).
 *
 * Returns empty string if no TS2339 diagnostics on Prisma-like types are found.
 */
export function generateTS2339Hints(
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): string {
  const TS2339_PATTERN = /^Property '(\w+)' does not exist on type '(\w+)'\.?$/;
  const PRISMA_MODEL_PATTERN = /^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)+$/;

  const seen = new Set<string>();
  const hints: Array<{ property: string; modelType: string }> = [];

  for (const diag of diagnostics) {
    if (Number(diag.code) !== 2339) continue;

    const match = diag.messageText.match(TS2339_PATTERN);
    if (match === null) continue;

    const [, property, typeName] = match;
    if (!PRISMA_MODEL_PATTERN.test(typeName)) continue;

    const key = `${property}::${typeName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    hints.push({ property, modelType: typeName });
  }

  if (hints.length === 0) return "";

  const lines = hints
    .map((h) => `- \`${h.property}\` on \`${h.modelType}\``)
    .join("\n");

  return [
    "## TS2339 Relation Field Hints",
    "",
    "These TS2339 errors are caused by accessing **Prisma relation fields** not available on the base model type.",
    "- For transformers: add the missing relation to `select()` using `NeighborTransformer.select()`",
    "- For collectors: use the **relation property name** (left side of schema definition) with `{ connect }` syntax",
    "",
    "Affected:",
    lines,
  ].join("\n");
}
