/**
 * Validates naming consistency across files by comparing backtick references
 * against canonical entity/field names from 02-domain-model YAML blocks.
 *
 * Only backtick-enclosed references (`Entity.field`) are checked.
 * Prose mentions of the same text are ignored to prevent false positives.
 */

export interface INamingViolation {
  fileIndex: number;
  sectionTitle: string;
  found: string;
  canonical: string;
  type: "entity" | "field";
  suggestion: string;
}

/**
 * Extract backtick-enclosed Entity.field references from content.
 * Returns unique references as `{ entity, field? }` pairs.
 */
export const extractBacktickReferences = (
  content: string,
): Array<{ entity: string; field?: string; raw: string }> => {
  const refs: Array<{ entity: string; field?: string; raw: string }> = [];
  // Match `Entity.field` or `Entity` patterns inside backticks
  const regex = /`([A-Z][a-zA-Z0-9]*)(?:\.([a-zA-Z_][a-zA-Z0-9_]*))?`/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    refs.push({
      entity: match[1],
      field: match[2] || undefined,
      raw: match[0],
    });
  }
  return refs;
};

/**
 * Validate naming consistency for a single section.
 */
export const validateNamingConsistency = (
  canonicalNames: ICanonicalNames,
  fileIndex: number,
  sectionTitle: string,
  sectionContent: string,
): INamingViolation[] => {
  const violations: INamingViolation[] = [];
  const refs = extractBacktickReferences(sectionContent);

  for (const ref of refs) {
    // Check entity name
    const canonicalEntity = findCanonicalEntity(
      canonicalNames.entities,
      ref.entity,
    );
    if (canonicalEntity && canonicalEntity !== ref.entity) {
      violations.push({
        fileIndex,
        sectionTitle,
        found: ref.entity,
        canonical: canonicalEntity,
        type: "entity",
        suggestion: `\`${ref.entity}\` → \`${canonicalEntity}\` (canonical from 02-domain-model)`,
      });
    }

    // Check field name
    if (ref.field && canonicalEntity) {
      const entityFields = canonicalNames.fields.get(canonicalEntity);
      if (entityFields) {
        const canonicalField = findCanonicalField(entityFields, ref.field);
        if (canonicalField && canonicalField !== ref.field) {
          violations.push({
            fileIndex,
            sectionTitle,
            found: `${ref.entity}.${ref.field}`,
            canonical: `${canonicalEntity}.${canonicalField}`,
            type: "field",
            suggestion: `\`${ref.entity}.${ref.field}\` → \`${canonicalEntity}.${canonicalField}\` (canonical from 02-domain-model)`,
          });
        }
      }
    }
  }

  return violations;
};

export interface ICanonicalNames {
  /** PascalCase entity names from 02-domain-model YAML. */
  entities: string[];
  /** Entity → field names mapping from 02-domain-model YAML. */
  fields: Map<string, string[]>;
}

/**
 * Case-insensitive entity name match.
 */
const findCanonicalEntity = (
  entities: string[],
  candidate: string,
): string | undefined =>
  entities.find((e) => e.toLowerCase() === candidate.toLowerCase());

/**
 * Case-insensitive field name match.
 */
const findCanonicalField = (
  fields: string[],
  candidate: string,
): string | undefined =>
  fields.find((f) => f.toLowerCase() === candidate.toLowerCase());
