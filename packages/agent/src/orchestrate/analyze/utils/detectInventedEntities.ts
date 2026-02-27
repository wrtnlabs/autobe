// ─── Invention Validator: Entity Catalog Enforcement ───

/**
 * Detect entity references in section content that are NOT in the authoritative
 * scenario entity catalog.
 *
 * Scans [DOWNSTREAM CONTEXT] Bridge Blocks for Entity.attribute references (in
 * "Attributes Specified", "Entities Modified" fields) and compares against the
 * scenario's entity list.
 *
 * Only checks within Bridge Blocks to avoid false positives from prose that
 * mentions entity names in natural language context.
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
    const bridgeBlocks = [
      ...section.content.matchAll(DOWNSTREAM_CONTEXT_REGEX),
    ];

    for (const block of bridgeBlocks) {
      const blockBody = block[1] ?? "";

      // Extract from "Entities Modified" field
      const entitiesModified = extractEntitiesModified(blockBody);
      for (const entity of entitiesModified) {
        if (!authorizedSet.has(entity.toLowerCase())) {
          unknownEntities.add(entity);
        }
      }

      // Extract from "Attributes Specified" (Entity.attribute pattern)
      const attributeEntities = extractEntityFromAttributes(blockBody);
      for (const entity of attributeEntities) {
        if (!authorizedSet.has(entity.toLowerCase())) {
          unknownEntities.add(entity);
        }
      }
    }
  }

  return [...unknownEntities].map(
    (entity) =>
      `Unknown entity "${entity}" referenced in Bridge Block but not in scenario entity catalog. ` +
      `Authorized entities: ${authorizedEntityNames.join(", ")}. ` +
      `Remove references to "${entity}" or use only authorized entities.`,
  );
};

// ─── Internal helpers ───

const DOWNSTREAM_CONTEXT_REGEX =
  /\*\*\[DOWNSTREAM CONTEXT\]\*\*([\s\S]*?)\n---/g;

/**
 * Extract entity names from "**Entities Modified**" field.
 *
 * Matches patterns like:
 *
 * - `**Entities Modified**: User, Todo`
 * - `**Entities Modified**: User (create), Todo (update)`
 */
const extractEntitiesModified = (blockBody: string): string[] => {
  const match = blockBody.match(/\*\*Entities Modified\*\*:\s*(.+)/);
  if (!match) return [];

  const value = match[1]!.trim();
  if (/^none$/i.test(value) || value === "—" || value === "-") return [];

  // Split by comma and extract entity names (strip parenthetical notes)
  return value
    .split(/,\s*/)
    .map((part) => part.replace(/\s*\(.*?\)\s*/g, "").trim())
    .filter((name) => PASCAL_CASE_PATTERN.test(name));
};

/**
 * Extract entity names from Entity.attribute patterns in "Attributes
 * Specified".
 *
 * Matches patterns like:
 *
 * - `- User.email: text(5-255), required`
 * - `- Todo.title: (defined in "Section Name")`
 */
const extractEntityFromAttributes = (blockBody: string): string[] => {
  const entities: Set<string> = new Set();
  const lines = blockBody.split("\n");
  let inAttributes = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("**Attributes Specified**")) {
      inAttributes = true;
      continue;
    }
    if (line.startsWith("**") && !line.startsWith("**Attributes Specified**")) {
      inAttributes = false;
      continue;
    }
    if (!inAttributes || !line.startsWith("-")) continue;

    const body = line.replace(/^-+\s*/, "");
    const dotIndex = body.indexOf(".");
    if (dotIndex < 0) continue;

    const entity = body.slice(0, dotIndex).trim();
    if (PASCAL_CASE_PATTERN.test(entity)) {
      entities.add(entity);
    }
  }

  return [...entities];
};

/**
 * PascalCase pattern — entity names start with uppercase and contain only
 * letters and digits.
 */
const PASCAL_CASE_PATTERN = /^[A-Z][a-zA-Z0-9]*$/;
