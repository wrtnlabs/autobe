import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";

/**
 * Generates concise TS2339-specific hints for Prisma relation field access
 * errors.
 *
 * Parses TS2339 "Property 'X' does not exist on type 'Y'" diagnostics,
 * deduplicates by property name, and returns a short explanation.
 *
 * Handles both simple type names (e.g., `shopping_sales`) and inline Prisma
 * GetPayload types (e.g., `{ id: string; body: string; ... }`).
 *
 * Returns empty string if no TS2339 diagnostics are found.
 */
export function generateTS2339Hints(
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): string {
  // Match both simple types and inline object types
  const TS2339_SIMPLE = /^Property '(\w+)' does not exist on type '(\w+)'\.?$/;
  const TS2339_INLINE =
    /^Property '(\w+)' does not exist on type '\{[^}]*\}'\.?$/;

  const seen = new Set<string>();
  const hints: Array<{ property: string; modelType: string }> = [];

  for (const diag of diagnostics) {
    if (Number(diag.code) !== 2339) continue;

    // Try simple type match first
    const simpleMatch = diag.messageText.match(TS2339_SIMPLE);
    if (simpleMatch !== null) {
      const [, property, typeName] = simpleMatch;
      const key = `${property}`;
      if (!seen.has(key)) {
        seen.add(key);
        hints.push({ property: property!, modelType: typeName! });
      }
      continue;
    }

    // Try inline object type match (Prisma GetPayload output)
    const inlineMatch = diag.messageText.match(TS2339_INLINE);
    if (inlineMatch !== null) {
      const [, property] = inlineMatch;
      const key = `${property}`;
      if (!seen.has(key)) {
        seen.add(key);
        hints.push({ property: property!, modelType: "(Prisma Payload)" });
      }
    }
  }

  if (hints.length === 0) return "";

  const lines = hints
    .map((h) => `- \`${h.property}\` on \`${h.modelType}\``)
    .join("\n");

  return [
    "## TS2339 Relation Field Hints",
    "",
    "These TS2339 errors are caused by accessing fields not available on the Prisma Payload type.",
    "This usually means the field is MISSING from your `select()` object.",
    "",
    "**Fix**: For each property below, add it to `select()`:",
    "- Scalar field → `fieldName: true`",
    "- Relation (has neighbor transformer) → `relation: NeighborTransformer.select()`",
    "- Relation (no transformer) → `relation: { select: { ... } }`",
    "- Aggregate count → `_count: { select: { relation: true } }`",
    "",
    "Affected properties:",
    lines,
  ].join("\n");
}
