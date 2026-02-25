import { AutoBeAnalyzeWriteSectionEvent } from "@autobe/interface";

// ─── DOWNSTREAM CONTEXT regex (reuse same pattern as buildConstraintConsistencyReport) ───

const DOWNSTREAM_CONTEXT_REGEX =
  /\*\*\[DOWNSTREAM CONTEXT\]\*\*([\s\S]*?)\n---/g;

// ─── A) TOC Bridge Block Auto-Strip ───

/**
 * Remove all [DOWNSTREAM CONTEXT] Bridge Blocks from TOC file sections.
 *
 * TOC (00-toc.md) is a navigation aid and MUST NOT contain Bridge Blocks.
 * This function mutates the section content in-place, stripping any
 * `**[DOWNSTREAM CONTEXT]**...---` blocks.
 */
export const stripTocBridgeBlocks = (
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
): void => {
  for (const sectionsForModule of sectionResults) {
    for (const sectionEvent of sectionsForModule) {
      for (const section of sectionEvent.sectionSections) {
        section.content = section.content.replace(
          DOWNSTREAM_CONTEXT_REGEX,
          "",
        );
      }
    }
  }
};

// ─── B) Technology Lock-in Detection ───

/**
 * Prohibited technology-specific keywords.
 *
 * Requirements documents must be technology-neutral. These patterns detect
 * specific database, ORM, framework, infrastructure, and algorithm references
 * that constitute implementation lock-in.
 */
const PROHIBITED_TECH_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  // Databases
  { regex: /\bPostgreSQL\b/i, label: "PostgreSQL" },
  { regex: /\bMySQL\b/i, label: "MySQL" },
  { regex: /\bMongoDB\b/i, label: "MongoDB" },
  { regex: /\bSQLite\b/i, label: "SQLite" },
  { regex: /\bDynamoDB\b/i, label: "DynamoDB" },
  { regex: /\bCockroachDB\b/i, label: "CockroachDB" },
  { regex: /\bMariaDB\b/i, label: "MariaDB" },
  // ORMs / Query Builders
  { regex: /\bPrisma\b/i, label: "Prisma" },
  { regex: /\bTypeORM\b/i, label: "TypeORM" },
  { regex: /\bSequelize\b/i, label: "Sequelize" },
  { regex: /\bDrizzle\b/i, label: "Drizzle" },
  { regex: /\bMikroORM\b/i, label: "MikroORM" },
  // Backend Frameworks
  { regex: /\bNestJS\b/i, label: "NestJS" },
  { regex: /\bExpress\b/i, label: "Express" },
  { regex: /\bDjango\b/i, label: "Django" },
  { regex: /\bSpring Boot\b/i, label: "Spring Boot" },
  { regex: /\bFastAPI\b/i, label: "FastAPI" },
  { regex: /\bRuby on Rails\b/i, label: "Ruby on Rails" },
  { regex: /\bLaravel\b/i, label: "Laravel" },
  // Infrastructure
  { regex: /\bRedis\b/i, label: "Redis" },
  { regex: /\bDocker\b/i, label: "Docker" },
  { regex: /\bKubernetes\b/i, label: "Kubernetes" },
  { regex: /\bNginx\b/i, label: "Nginx" },
  // Cloud Providers
  { regex: /\bAWS\b/, label: "AWS" },
  { regex: /\bGCP\b/, label: "GCP" },
  { regex: /\bAzure\b/i, label: "Azure" },
  // Algorithm specifics
  {
    regex: /\bbcrypt\s+(?:with\s+)?cost\s+factor/i,
    label: "bcrypt cost factor",
  },
  // DB-specific syntax
  { regex: /\bRETURNING\s+clause\b/i, label: "RETURNING clause (DB-specific)" },
];

/**
 * Detect technology lock-in in section content.
 *
 * Scans all section titles and content for prohibited technology-specific
 * keywords. Used in the validate callback to force LLM retry.
 *
 * @returns Array of human-readable violation strings (empty = no violations)
 */
export const detectTechLockin = (
  sections: Array<{ title: string; content: string }>,
): string[] => {
  const violations: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    const combined = `${section.title}\n${section.content}`;

    for (const { regex, label } of PROHIBITED_TECH_PATTERNS) {
      // Reset lastIndex for safety (though these don't use /g flag)
      regex.lastIndex = 0;
      if (regex.test(combined)) {
        violations.push(
          `Section "${section.title}": Technology lock-in "${label}" detected. ` +
            `Requirements must be technology-neutral. Replace with a generic equivalent.`,
        );
      }
    }
  }

  return violations;
};

// ─── C) Empty Bridge Block Detection ───

/**
 * Regex to test if a Bridge Block line has only "None", "N/A", "—", or "-"
 * as its value (with optional parenthetical notes).
 */
const EMPTY_VALUE_PATTERN = /:\s*(None|N\/A|—|-)\s*(\(.*\))?\s*$/i;

/**
 * Detect sections with completely empty Bridge Blocks.
 *
 * A Bridge Block where ALL fields are "None" indicates meta-content that fails
 * the EARS test ("Does this section produce at least one EARS requirement with
 * a non-empty Bridge Block?"). Such sections should be rejected.
 *
 * @returns Array of violation objects with file context for feedback injection
 */
export const detectEmptyBridgeBlocks = (
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
): IEmptyBridgeBlockViolation[] => {
  const violations: IEmptyBridgeBlockViolation[] = [];

  for (
    let moduleIndex = 0;
    moduleIndex < sectionResults.length;
    moduleIndex++
  ) {
    const sectionsForModule = sectionResults[moduleIndex]!;
    for (
      let unitIndex = 0;
      unitIndex < sectionsForModule.length;
      unitIndex++
    ) {
      const sectionEvent = sectionsForModule[unitIndex]!;
      for (const section of sectionEvent.sectionSections) {
        const blocks = [
          ...section.content.matchAll(
            /\*\*\[DOWNSTREAM CONTEXT\]\*\*([\s\S]*?)\n---/g,
          ),
        ];

        for (const block of blocks) {
          const blockBody = block[1] ?? "";
          const lines = blockBody
            .split("\n")
            .map((l) => l.trim())
            .filter(
              (l) =>
                l.length > 0 &&
                !l.startsWith("**[DOWNSTREAM") &&
                l !== "---",
            );

          // Check if all non-header lines have "None" values
          const valueLines = lines.filter((l) => l.startsWith("-") || l.includes(":"));
          if (
            valueLines.length > 0 &&
            valueLines.every((l) => EMPTY_VALUE_PATTERN.test(l))
          ) {
            violations.push({
              moduleIndex,
              unitIndex,
              sectionTitle: section.title,
              detail:
                `Section "${section.title}" has an empty Bridge Block (all fields are None). ` +
                `This section fails the EARS test and should either contain substantive ` +
                `requirements with non-empty Bridge Block fields, or be removed entirely.`,
            });
          }
        }
      }
    }
  }

  return violations;
};

export interface IEmptyBridgeBlockViolation {
  moduleIndex: number;
  unitIndex: number;
  sectionTitle: string;
  detail: string;
}
