import YAML from "yaml";

// ─── Invention Validator: Entity Catalog Enforcement ───

const YAML_CODE_BLOCK_REGEX = /```yaml\n([\s\S]*?)```/g;

/** Match backtick `Entity.field` patterns */
const BACKTICK_ENTITY_FIELD_REGEX = /`(\w+)\.(\w+)`/g;

/**
 * Detect entity references in section content that are NOT in the authoritative
 * scenario entity catalog.
 *
 * Scans YAML spec blocks and backtick `Entity.field` references for entity
 * names and compares against the scenario's entity list.
 *
 * @returns Array of human-readable violation strings (empty = no violations)
 */
export const detectInventedEntities = (
  sections: Array<{ title: string; content: string }>,
  authorizedEntityNames: string[],
): string[] => {
  if (authorizedEntityNames.length === 0) return [];

  const authorizedSet = new Set(
    authorizedEntityNames.map((n) => n.toLowerCase()),
  );
  const unknownEntities: Set<string> = new Set();

  for (const section of sections) {
    // Extract entities from YAML spec blocks
    const yamlMatches = section.content.matchAll(YAML_CODE_BLOCK_REGEX);
    for (const match of yamlMatches) {
      const yamlContent = match[1] ?? "";
      try {
        const parsed = YAML.parse(yamlContent);
        if (parsed && typeof parsed === "object") {
          // Entity attribute YAML blocks
          if (typeof parsed.entity === "string") {
            if (!authorizedSet.has(parsed.entity.toLowerCase())) {
              unknownEntities.add(parsed.entity);
            }
          }
          // Permission YAML blocks
          if (Array.isArray(parsed.permissions)) {
            for (const perm of parsed.permissions) {
              if (perm && typeof perm.resource === "string") {
                if (!authorizedSet.has(perm.resource.toLowerCase())) {
                  unknownEntities.add(perm.resource);
                }
              }
            }
          }
        }
      } catch {
        // skip parse errors
      }
    }

    // Extract entities from backtick `Entity.field` references
    const backtickMatches = section.content.matchAll(
      BACKTICK_ENTITY_FIELD_REGEX,
    );
    for (const match of backtickMatches) {
      const entity = match[1]!;
      if (
        PASCAL_CASE_PATTERN.test(entity) &&
        !authorizedSet.has(entity.toLowerCase())
      ) {
        unknownEntities.add(entity);
      }
    }
  }

  return [...unknownEntities].map(
    (entity) =>
      `Unknown entity "${entity}" referenced but not in scenario entity catalog. ` +
      `Authorized entities: ${authorizedEntityNames.join(", ")}. ` +
      `Remove references to "${entity}" or use only authorized entities.`,
  );
};

/**
 * PascalCase pattern — entity names start with uppercase and contain only
 * letters and digits.
 */
const PASCAL_CASE_PATTERN = /^[A-Z][a-zA-Z0-9]*$/;
