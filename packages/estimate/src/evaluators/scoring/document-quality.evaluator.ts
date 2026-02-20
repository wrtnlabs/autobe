import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { BaseEvaluator } from "../base";

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
      if (hasDocsFolder) score += 20;
      if (hasReadme) score += 10;

      if (docFiles.length >= 5) score += 15;
      else if (docFiles.length >= 3) score += 10;
      else if (docFiles.length >= 1) score += 5;

      if (totalDocLength >= 50000) score += 15;
      else if (totalDocLength >= 20000) score += 10;
      else if (totalDocLength >= 5000) score += 5;

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
      weightedScore: score * 0.2,
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

    let filesWithHeaders = 0;
    for (const [, content] of contents) {
      const headerCount = (content.match(/^#{1,3}\s+\S/gm) || []).length;
      if (headerCount >= 2) filesWithHeaders++;
    }
    const headerRatio = filesWithHeaders / contents.size;
    score += Math.round(headerRatio * 10);

    const requirementPatterns =
      /\b(shall|must|should|endpoint|api|database|schema|model|entity|table|column|field|interface|controller|provider|service|authentication|authorization)\b/gi;
    let filesWithRequirements = 0;
    for (const [, content] of contents) {
      const matches = content.match(requirementPatterns) || [];
      if (matches.length >= 5) filesWithRequirements++;
    }
    const reqRatio = filesWithRequirements / contents.size;
    score += Math.round(reqRatio * 10);

    const boilerplatePatterns =
      /\b(lorem ipsum|placeholder|todo|tbd|coming soon|work in progress)\b/gi;
    let boilerplateFiles = 0;
    for (const [, content] of contents) {
      if (boilerplatePatterns.test(content) || content.trim().length < 200) {
        boilerplateFiles++;
      }
      boilerplatePatterns.lastIndex = 0;
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
    }

    const realContentRatio = (contents.size - boilerplateFiles) / contents.size;
    score += Math.round(realContentRatio * 5);

    return score;
  }

  private analyzeReadmeQuality(content: string, issues: Issue[]): number {