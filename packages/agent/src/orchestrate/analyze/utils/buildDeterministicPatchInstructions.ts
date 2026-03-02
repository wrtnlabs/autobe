import { IScopeViolation } from "./buildScopeValidator";
import { INamingViolation } from "./buildNamingConsistencyValidator";

/**
 * Generates deterministic (LLM-free) patch instructions from mechanical
 * violations detected during cross-file validation.
 *
 * These violations have unambiguous fixes that don't require LLM judgment:
 * - Undefined references → add to canonical or remove from referencing file
 * - Naming mismatches → rename to canonical form
 * - Scope violations → move content to correct file
 * - Undefined error codes → add to 04 or remove reference
 * - Permission conflicts → align with 01 canonical
 */

export interface IMechanicalViolation {
  type:
    | "undefined-ref"
    | "naming-mismatch"
    | "scope-violation"
    | "undefined-error"
    | "permission-conflict"
    | "yaml-parse-error";
  fileIndex: number;
  sectionTitle: string;
  detail: string;
  suggestion: string;
}

/**
 * Convert scope violations into mechanical violations.
 */
export const fromScopeViolations = (
  violations: IScopeViolation[],
): IMechanicalViolation[] =>
  violations.map((v) => ({
    type: "scope-violation" as const,
    fileIndex: v.fileIndex,
    sectionTitle: v.sectionTitle,
    detail: `Forbidden pattern matched: "${v.matchedText}" in ${v.categoryId}`,
    suggestion: v.suggestion,
  }));

/**
 * Convert naming violations into mechanical violations.
 */
export const fromNamingViolations = (
  violations: INamingViolation[],
): IMechanicalViolation[] =>
  violations.map((v) => ({
    type: "naming-mismatch" as const,
    fileIndex: v.fileIndex,
    sectionTitle: v.sectionTitle,
    detail: `${v.type} naming mismatch: found \`${v.found}\`, canonical is \`${v.canonical}\``,
    suggestion: v.suggestion,
  }));

/**
 * Build deterministic patch instruction strings grouped by file index.
 *
 * Each instruction is a human-readable string that can be passed directly
 * to the section patch orchestrator without LLM interpretation.
 */
export const buildDeterministicPatchInstructions = (
  violations: IMechanicalViolation[],
): Map<number, string[]> => {
  const result = new Map<number, string[]>();

  for (const v of violations) {
    const instructions = result.get(v.fileIndex) ?? [];
    instructions.push(formatInstruction(v));
    result.set(v.fileIndex, instructions);
  }

  return result;
};

/**
 * Format a single violation into a patch instruction string.
 */
const formatInstruction = (v: IMechanicalViolation): string => {
  const prefix = INSTRUCTION_PREFIX[v.type];
  return `[${prefix}] Section "${v.sectionTitle}": ${v.detail}\n  → ${v.suggestion}`;
};

const INSTRUCTION_PREFIX: Record<IMechanicalViolation["type"], string> = {
  "undefined-ref": "UNDEFINED_REF",
  "naming-mismatch": "NAMING",
  "scope-violation": "SCOPE",
  "undefined-error": "UNDEFINED_ERR",
  "permission-conflict": "PERMISSION",
  "yaml-parse-error": "YAML_ERROR",
};

/**
 * Format all patch instructions as a single string for logging/debugging.
 */
export const formatAllInstructions = (
  instructions: Map<number, string[]>,
): string => {
  const lines: string[] = [];
  for (const [fileIndex, patches] of instructions.entries()) {
    lines.push(`\n--- File ${fileIndex} ---`);
    for (const patch of patches) {
      lines.push(patch);
    }
  }
  return lines.join("\n");
};
