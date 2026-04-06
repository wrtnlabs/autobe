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
 * Generates hints for TS2322/TS1360 "Property 'X' is missing in type" errors.
 *
 * These errors occur when Prisma's `create()`/`update()` data object is missing
 * required fields (e.g., FK columns, required scalars). Extracts the missing
 * property name and the expected type, then provides actionable guidance.
 *
 * Returns empty string if no matching diagnostics are found.
 */
export function generateMissingPropertyHints(
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): string {
  const MISSING_PROP =
    /Property '(\w+)' is missing in type '.*?' but required in type '(\w+)'/;

  const seen = new Set<string>();
  const hints: Array<{ property: string; expectedType: string }> = [];

  for (const diag of diagnostics) {
    if (Number(diag.code) !== 2322 && Number(diag.code) !== 1360) continue;

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
    "## Missing Required Property Hints (TS2322/TS1360)",
    "",
    "These errors mean your data object is missing required fields.",
    "This usually happens with Prisma `create()` / `update()` calls when",
    "a required column or FK is omitted from the `data` object.",
    "",
    "**Fix**: Add the missing properties to your `data` object.",
    "- For FK columns → provide the correct foreign key value (e.g., `reddit_clone_member_id: memberRecord.id`)",
    "- For required scalars → provide the required value",
    "- If using `satisfies XxxUncheckedCreateInput`, ALL required columns of that type must be present",
    "- If the field is a relation FK that should be nullable, use `Prisma.XxxCreateInput` (relation-based) instead of `UncheckedCreateInput`",
    "",
    "Missing properties:",
    lines,
  ].join("\n");
}
