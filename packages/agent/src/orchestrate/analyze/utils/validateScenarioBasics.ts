import { AutoBeAnalyze } from "@autobe/interface";

// ─── Scenario Pre-Check: Structural Soundness Validation ───

export interface IScenarioValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate scenario output for structural soundness before LLM review.
 *
 * Checks minimum entity count, actor completeness, relationship integrity, and
 * cross-reference consistency. Zero token cost — purely programmatic.
 */
export const validateScenarioBasics = (props: {
  prefix: string;
  actors: AutoBeAnalyze.IActor[];
  entities: Array<{
    name: string;
    attributes: string[];
    relationships?: string[];
  }>;
}): IScenarioValidationResult => {
  const errors: string[] = [];

  // 1. Prefix non-empty
  if (!props.prefix || props.prefix.trim().length === 0)
    errors.push("Project prefix is empty.");

  // 2. Minimum entity count (User + at least 1 domain entity)
  if (props.entities.length < 2)
    errors.push(
      `Entity count is ${props.entities.length}, below minimum (2). Most domains require at least User + 1 domain entity.`,
    );

  // 3. Actor basics: guest and member must exist
  if (!props.actors.some((a) => a.kind === "guest"))
    errors.push(
      "Missing guest actor. Public endpoints (registration, login) require a guest actor.",
    );
  if (!props.actors.some((a) => a.kind === "member"))
    errors.push(
      "Missing member actor. Authenticated features require a member actor.",
    );

  // 4. Each entity must have at least 2 attributes
  for (const entity of props.entities) {
    if (entity.attributes.length < 2)
      errors.push(
        `Entity "${entity.name}" has ${entity.attributes.length} attribute(s), below minimum (2).`,
      );
  }

  // 5. Each entity should have at least 1 relationship
  for (const entity of props.entities) {
    if (!entity.relationships || entity.relationships.length === 0)
      errors.push(
        `Entity "${entity.name}" has no relationships. Every entity should relate to at least one other entity.`,
      );
  }

  // 6. Cross-reference: relationship targets must exist in entities list
  const entityNames = new Set(props.entities.map((e) => e.name.toLowerCase()));
  for (const entity of props.entities) {
    for (const rel of entity.relationships ?? []) {
      const refNames = extractRelationshipTargets(rel);
      for (const refName of refNames) {
        if (!entityNames.has(refName.toLowerCase()))
          errors.push(
            `Entity "${entity.name}" references "${refName}" in relationship "${rel}" but "${refName}" is not in the entities list.`,
          );
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Extract entity names referenced in a relationship string.
 *
 * Handles patterns like:
 *
 * - "belongsTo User via userId"
 * - "hasMany Todo"
 * - "manyToMany Tag through TodoTag"
 */
const extractRelationshipTargets = (rel: string): string[] => {
  const targets: string[] = [];
  const patterns = [
    /(?:belongsTo|hasMany|hasOne|manyToMany)\s+(\w+)/gi,
    /(?:through|via)\s+(\w+)/gi,
  ];
  for (const pattern of patterns) {
    for (const match of rel.matchAll(pattern)) {
      const name = match[1];
      if (name && PASCAL_CASE_PATTERN.test(name)) targets.push(name);
    }
  }
  return targets;
};

const PASCAL_CASE_PATTERN = /^[A-Z][a-zA-Z0-9]*$/;
