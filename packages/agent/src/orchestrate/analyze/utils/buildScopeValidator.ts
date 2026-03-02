import { FixedAnalyzeTemplate } from "../structures/FixedAnalyzeTemplate";

/**
 * Validates that a section's content stays within its file's scope.
 *
 * Each file in the fixed 6-file SRS structure has forbidden patterns —
 * content that belongs in another file. This validator detects scope
 * violations so they can be fed back as patch instructions.
 */

export interface IScopeViolation {
  fileIndex: number;
  categoryId: FixedAnalyzeTemplate.CategoryId;
  sectionTitle: string;
  pattern: string;
  matchedText: string;
  suggestion: string;
}

/**
 * Check a single section's content against the file's forbidden patterns.
 */
export const validateFileScope = (
  fileTemplate: FixedAnalyzeTemplate.IFileTemplate,
  fileIndex: number,
  sectionTitle: string,
  sectionContent: string,
): IScopeViolation[] => {
  const violations: IScopeViolation[] = [];

  for (const pattern of fileTemplate.forbiddenPatterns) {
    const match = pattern.exec(sectionContent);
    if (match) {
      const ownerFile = findOwnerFile(pattern);
      violations.push({
        fileIndex,
        categoryId: fileTemplate.categoryId,
        sectionTitle,
        pattern: pattern.source,
        matchedText: match[0].slice(0, 80),
        suggestion: ownerFile
          ? `This content belongs in ${ownerFile}. Move it there or remove from ${fileTemplate.filename}.`
          : `This content violates the scope of ${fileTemplate.filename}. Remove or relocate.`,
      });
    }
  }

  return violations;
};

/**
 * Check all sections across all files.
 */
export const validateAllFileScopes = (
  files: Array<{
    template: FixedAnalyzeTemplate.IFileTemplate;
    fileIndex: number;
    sections: Array<{ title: string; content: string }>;
  }>,
): IScopeViolation[] => {
  const violations: IScopeViolation[] = [];
  for (const file of files) {
    for (const section of file.sections) {
      violations.push(
        ...validateFileScope(
          file.template,
          file.fileIndex,
          section.title,
          section.content,
        ),
      );
    }
  }
  return violations;
};

/**
 * Map forbidden patterns back to the file that should own the content.
 */
const PATTERN_OWNER_MAP: Array<{
  test: (source: string) => boolean;
  owner: string;
}> = [
  {
    test: (s) => /SHALL|SHOULD/i.test(s),
    owner: "03-functional-requirements.md or 04-business-rules.md",
  },
  {
    test: (s) => /type\|required\|default/i.test(s) || /entity:/i.test(s),
    owner: "02-domain-model.md",
  },
  {
    test: (s) => /GET|POST|PUT|PATCH|DELETE/i.test(s),
    owner: "03-functional-requirements.md",
  },
  {
    test: (s) => /INDEX|CASCADE|SET\s+NULL/i.test(s),
    owner: "02-domain-model.md",
  },
  {
    test: (s) => /errors:/i.test(s),
    owner: "04-business-rules.md",
  },
];

const findOwnerFile = (pattern: RegExp): string | undefined => {
  const source = pattern.source;
  for (const entry of PATTERN_OWNER_MAP) {
    if (entry.test(source)) return entry.owner;
  }
  return undefined;
};
