import { AutoBeAnalyzeWriteSectionEvent } from "@autobe/interface";

// ─── DOWNSTREAM CONTEXT regex (reuse same pattern as buildConstraintConsistencyReport) ───

const DOWNSTREAM_CONTEXT_REGEX =
  /\*\*\[DOWNSTREAM CONTEXT\]\*\*([\s\S]*?)\n---/g;

// ─── A) TOC Bridge Block Auto-Strip ───

/**
 * Remove all [DOWNSTREAM CONTEXT] Bridge Blocks from TOC file sections.
 *
 * TOC (00-toc.md) is a navigation aid and MUST NOT contain Bridge Blocks. This
 * function mutates the section content in-place, stripping any `**[DOWNSTREAM
 * CONTEXT]**...---` blocks.
 */
export const stripTocBridgeBlocks = (
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
): void => {
  for (const sectionsForModule of sectionResults) {
    for (const sectionEvent of sectionsForModule) {
      for (const section of sectionEvent.sectionSections) {
        section.content = section.content.replace(DOWNSTREAM_CONTEXT_REGEX, "");
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

// ─── C) Empty Bridge Block Detection (disabled) ───

/**
 * Detect sections with completely empty Bridge Blocks.
 *
 * Currently disabled — always returns empty array. Bridge Blocks are now
 * advisory rather than mandatory.
 *
 * @returns Always returns empty array
 */
export const detectEmptyBridgeBlocks = (
  _sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
): IEmptyBridgeBlockViolation[] => {
  return [];
};

export interface IEmptyBridgeBlockViolation {
  moduleIndex: number;
  unitIndex: number;
  sectionTitle: string;
  detail: string;
}

// ─── D) Oversized TOC Detection ───

const TOC_MAX_LINES = 400;

/**
 * Detect if the TOC file's sections exceed the maximum line count.
 *
 * TOC (00-toc.md) should be a concise navigation aid, not a detailed
 * requirements document. If the total line count across all sections exceeds
 * `TOC_MAX_LINES`, returns a violation string.
 *
 * @returns Array of violation strings (empty = no violation)
 */
export const detectOversizedToc = (
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
): string[] => {
  let totalLines = 0;

  for (const sectionsForModule of sectionResults) {
    for (const sectionEvent of sectionsForModule) {
      for (const section of sectionEvent.sectionSections) {
        totalLines += section.content.split("\n").length;
      }
    }
  }

  if (totalLines > TOC_MAX_LINES) {
    return [
      `TOC exceeds ${TOC_MAX_LINES} lines (actual: ${totalLines}). ` +
        `Remove detailed requirements, keep only navigation tables and brief summaries.`,
    ];
  }

  return [];
};
