import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { PHASE_WEIGHTS, createIssue } from "../../types";
import { BaseEvaluator } from "../base";

/** Result of reading docs folder */
interface DocsFolderResult {
  files: string[];
  totalLength: number;
  contents: Map<string, string>;
}

/** Result of reading README */
interface ReadmeResult {
  length: number;
  content: string;
}

export class DocumentQualityEvaluator extends BaseEvaluator {
  readonly name = "DocumentQualityEvaluator";
  readonly phase = "documentQuality" as const;
  readonly description = "Evaluates documentation quality";

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();

    const docsPath = path.join(context.project.rootPath, "docs", "analysis");
    const readmePath = path.join(context.project.rootPath, "README.md");

    const hasDocsFolder = fs.existsSync(docsPath);
    const hasReadme = fs.existsSync(readmePath);

    const [docsResult, readmeResult] = await Promise.all([
      this.readDocsFolder(docsPath, hasDocsFolder),
      this.readReadme(readmePath, hasReadme),
    ]);

    const docFiles = docsResult.files;
    const totalDocLength = docsResult.totalLength + readmeResult.length;

    let score = 0;

    if (!hasDocsFolder && !hasReadme) {
      score = 0;
      issues.push(
        createIssue({
          severity: "critical",
          category: "documentation",
          code: "DOC001",
          message:
            "No documentation found (missing docs/analysis/ and README.md)",
        }),
      );
    } else {
      if (hasDocsFolder) score += 10;
      if (hasReadme) score += 5;

      // Doc file count: continuous interpolation (max 15)
      // 0 files → 0, 1 → 3, 5 → 10, 10+ → 15
      {
        const fileCountScore =
          docFiles.length >= 10
            ? 15
            : docFiles.length >= 1
              ? Math.round(3 + ((docFiles.length - 1) / 9) * 12)
              : 0;
        score += fileCountScore;
      }

      // Doc length: normalize by endpoint count for project-size awareness (max 15)
      // Expect ~2KB per endpoint as baseline; fall back to absolute thresholds
      // when endpoint count is unavailable.
      {
        const endpointCount = context.files.controllers.length || 1;
        const expectedLength = Math.max(5000, endpointCount * 2000);
        const lengthRatio = Math.min(1, totalDocLength / expectedLength);
        score += Math.round(lengthRatio * 15);
      }

      const qualityScore = this.analyzeContentQuality(
        docsResult.contents,
        issues,
      );
      score += qualityScore;

      const readmeScore = this.analyzeReadmeQuality(
        readmeResult.content,
        issues,
      );
      score += readmeScore;

      score = Math.min(100, score);

      if (!hasDocsFolder) {
        issues.push(
          createIssue({
            severity: "warning",
            category: "documentation",
            code: "DOC002",
            message: "Missing docs/analysis/ folder",
          }),
        );
      }

      if (!hasReadme) {
        issues.push(
          createIssue({
            severity: "warning",
            category: "documentation",
            code: "DOC003",
            message: "Missing README.md",
          }),
        );
      }

      if (totalDocLength < 5000) {
        issues.push(
          createIssue({
            severity: "suggestion",
            category: "documentation",
            code: "DOC004",
            message: "Documentation is sparse, consider adding more details",
          }),
        );
      }
    }

    return {
      phase: "documentQuality",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * PHASE_WEIGHTS.documentQuality,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        hasDocsFolder,
        hasReadme,
        docFileCount: docFiles.length,
        totalDocLength,
      },
    };
  }

  private analyzeContentQuality(
    contents: Map<string, string>,
    issues: Issue[],
  ): number {
    if (contents.size === 0) return 0;
    let score = 0;

    // Header quality — require rich structure (max 10)
    let filesWithRichHeaders = 0;
    for (const [, content] of contents) {
      const headerCount = (content.match(/^#{1,3}\s+\S/gm) || []).length;
      if (headerCount >= 8) filesWithRichHeaders++;
      else if (headerCount >= 5) filesWithRichHeaders += 0.7;
      else if (headerCount >= 2) filesWithRichHeaders += 0.3;
    }
    const headerRatio = filesWithRichHeaders / contents.size;
    score += Math.round(headerRatio * 10);

    // Requirement coverage — require domain-specific terminology (max 10)
    const requirementPatterns =
      /\b(shall|must|should|endpoint|api|database|schema|model|entity|table|column|field|interface|controller|provider|service|authentication|authorization)\b/gi;
    let filesWithRichRequirements = 0;
    for (const [, content] of contents) {
      const matches = content.match(requirementPatterns) || [];
      if (matches.length >= 30) filesWithRichRequirements++;
      else if (matches.length >= 15) filesWithRichRequirements += 0.5;
      else if (matches.length >= 5) filesWithRichRequirements += 0.2;
    }
    const reqRatio = filesWithRichRequirements / contents.size;
    score += Math.round(reqRatio * 10);

    // Boilerplate penalty
    const boilerplatePattern =
      /\b(lorem ipsum|placeholder|tbd|coming soon|work in progress)\b/i;
    let boilerplateFiles = 0;
    for (const [, content] of contents) {
      if (boilerplatePattern.test(content) || content.trim().length < 200) {
        boilerplateFiles++;
      }
    }
    if (boilerplateFiles > 0) {
      issues.push(
        createIssue({
          severity: "warning",
          category: "documentation",
          code: "DOC005",
          message: `${boilerplateFiles} doc file(s) contain boilerplate or minimal content`,
        }),
      );
      // Direct penalty for boilerplate (max -10)
      score -= Math.min(
        10,
        Math.round((boilerplateFiles / contents.size) * 15),
      );
    }

    // Content depth bonus — average word count per file (max 10)
    let totalWords = 0;
    for (const [, content] of contents) {
      totalWords += content.split(/\s+/).length;
    }
    const avgWords = totalWords / contents.size;
    if (avgWords >= 1000) score += 10;
    else if (avgWords >= 500) score += 7;
    else if (avgWords >= 200) score += 4;
    else if (avgWords >= 100) score += 2;

    // Content diversity — check for varied topic coverage (max 10)
    const topicPatterns = [
      /\b(erd|entity.?relationship|database\s+design)\b/i,
      /\b(api|endpoint|route|rest|http)\b/i,
      /\b(security|auth|permission|role|guard)\b/i,
      /\b(test|spec|scenario|coverage)\b/i,
      /\b(deploy|environment|config|docker|ci.?cd)\b/i,
      /\b(error|exception|handling|validation)\b/i,
    ];
    const allContent = Array.from(contents.values()).join("\n");
    const topicsCovered = topicPatterns.filter((p) =>
      p.test(allContent),
    ).length;
    score += Math.round((topicsCovered / topicPatterns.length) * 10);

    return Math.max(0, score);
  }

  private analyzeReadmeQuality(content: string, issues: Issue[]): number {
    if (!content || content.length === 0) return 0;

    let score = 0;

    // Length (max 5)
    if (content.length >= 3000) score += 5;
    else if (content.length >= 1500) score += 3;
    else if (content.length >= 500) score += 2;
    else score += 1;

    // Headers (max 5)
    const headers = (content.match(/^#{1,3}\s+\S/gm) || []).length;
    if (headers >= 8) score += 5;
    else if (headers >= 5) score += 3;
    else if (headers >= 2) score += 2;
    else if (headers >= 1) score += 1;

    // Useful sections (max 5)
    const usefulSections =
      /\b(installation|setup|getting started|usage|api|architecture|endpoints|configuration|environment|deployment|prerequisites|running|build)\b/gi;
    const sectionMatches = content.match(usefulSections) || [];
    if (sectionMatches.length >= 5) score += 5;
    else if (sectionMatches.length >= 3) score += 3;
    else if (sectionMatches.length >= 1) score += 1;

    // Code blocks presence (max 5) — good READMEs have examples
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    if (codeBlocks >= 3) score += 5;
    else if (codeBlocks >= 1) score += 3;

    if (headers === 0 && content.length < 500) {
      issues.push(
        createIssue({
          severity: "suggestion",
          category: "documentation",
          code: "DOC006",
          message: "README lacks structure — add headers and sections",
        }),
      );
    }

    return score;
  }

  private async readDocsFolder(
    docsPath: string,
    exists: boolean,
  ): Promise<DocsFolderResult> {
    if (!exists) return { files: [], totalLength: 0, contents: new Map() };

    try {
      const allFiles = await fs.promises.readdir(docsPath);
      const docFiles = allFiles.filter(
        (f) => f.endsWith(".md") || f.endsWith(".json"),
      );

      const contents = new Map<string, string>();
      await Promise.all(
        docFiles.map(async (file) => {
          try {
            const content = await fs.promises.readFile(
              path.join(docsPath, file),
              "utf-8",
            );
            contents.set(file, content);
          } catch {
            // skip unreadable files
          }
        }),
      );

      let totalLength = 0;
      for (const [, content] of contents) {
        totalLength += content.length;
      }

      return { files: docFiles, totalLength, contents };
    } catch {
      return { files: [], totalLength: 0, contents: new Map() };
    }
  }

  private async readReadme(
    readmePath: string,
    exists: boolean,
  ): Promise<ReadmeResult> {
    if (!exists) return { length: 0, content: "" };

    try {
      const content = await fs.promises.readFile(readmePath, "utf-8");
      return { length: content.length, content };
    } catch {
      return { length: 0, content: "" };
    }
  }
}
