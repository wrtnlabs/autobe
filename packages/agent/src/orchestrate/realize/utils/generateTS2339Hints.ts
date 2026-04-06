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
    "**Fix**: For each property below, add it to `select()` — but first verify the property name exists in the **Relation Mapping Table**:",
    "- Scalar field → `fieldName: true`",
    "- Relation (has neighbor transformer) → `relation: NeighborTransformer.select()`",
    "- Relation (no transformer) → `relation: { select: { ... } }`",
    "- Aggregate count → `_count: { select: { relation: true } }`",
    "",
    "Affected properties:",
    lines,
  ].join("\n");
}

/**
 * Extracts "Did you mean 'X'?" suggestions from TS2353/TS2339 diagnostics.
 *
 * The TypeScript compiler provides these suggestions when a property name is
 * close to a valid one (e.g., `owner_member` → `ownerMember`).
 */
export function extractDidYouMeanHints(
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): Array<{ wrong: string; suggested: string }> {
  const DID_YOU_MEAN =
    /(?:property '(\w+)' does not exist|'(\w+)' does not exist in type)[^]*?Did you mean (?:to write )?'(\w+)'/i;

  const seen = new Set<string>();
  const hints: Array<{ wrong: string; suggested: string }> = [];

  for (const diag of diagnostics) {
    const match = diag.messageText.match(DID_YOU_MEAN);
    if (match !== null) {
      const wrong = match[1] ?? match[2]!;
      const suggested = match[3]!;
      const key = `${wrong}->${suggested}`;
      if (!seen.has(key)) {
        seen.add(key);
        hints.push({ wrong, suggested });
      }
    }
  }

  return hints;
}

/**
 * Generates hints for TS1360 "Property 'X' is missing in type" errors.
 *
 * TS1360 fires exclusively on `satisfies` expressions, so the expectedType is
 * always the single type the developer explicitly chose — no union branch
 * ambiguity. TS2322 "missing property" errors are intentionally excluded
 * because they report failures against ALL branches of a union type (e.g.,
 * `CreateInput | UncheckedCreateInput`), producing misleading hints.
 *
 * Returns empty string if no TS1360 "missing property" diagnostics are found.
 */
export function generateMissingPropertyHints(
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): string {
  const MISSING_PROP =
    /Property '(\w+)' is missing in type '.*?' but required in type '(\w+)'/;

  const seen = new Set<string>();
  const hints: Array<{ property: string; expectedType: string }> = [];

  for (const diag of diagnostics) {
    // Only TS1360 — from explicit `satisfies` annotation.
    // TS2322 "missing property" is noise from union branch exploration.
    if (Number(diag.code) !== 1360) continue;

    const match = diag.messageText.match(MISSING_PROP);
    if (match !== null) {
      const property = match[1]!;
      const expectedType = match[2]!;
      const key = `${property}@${expectedType}`;
      if (!seen.has(key)) {
        seen.add(key);
        hints.push({ property, expectedType });
      }
    }
  }

  if (hints.length === 0) return "";

  const lines = hints
    .map((h) => `- \`${h.property}\` (required by \`${h.expectedType}\`)`)
    .join("\n");

  return [
    "## Missing Required Property Hints (TS1360)",
    "",
    "Your `satisfies` type annotation requires properties that are missing from the data object.",
    "",
    "**Fix**: Add the missing FK column or required scalar to the `data` object.",
    "",
    "Missing properties:",
    lines,
  ].join("\n");
}
