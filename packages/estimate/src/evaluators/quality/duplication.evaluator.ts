import * as crypto from "crypto";
import * as fs from "fs";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { BaseEvaluator } from "../base";

/** Location of a code block */
interface CodeBlockLocation {
  file: string;
  line: number;
}

export class DuplicationEvaluator extends BaseEvaluator {
  readonly name = "DuplicationEvaluator";
  readonly phase = "quality" as const;
  readonly description = "Detects duplicate code blocks";

  private readonly MIN_LINES = 10;
  private readonly MIN_CHARS = 100;

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();

    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.providers,
    ];

    const codeBlocks: Map<string, CodeBlockLocation[]> = new Map();

    // Read all files in parallel
    const fileContents = await Promise.all(
      filesToCheck.map(async (filePath) => {
        try {
          const content = await fs.promises.readFile(filePath, "utf-8");
          return { filePath, content };
        } catch {
          return null;
        }
      }),
    );

    // Collect blocks from all files
    for (const result of fileContents) {
      if (result) {
        this.collectBlocks(result.filePath, result.content, codeBlocks);
      }
    }

    // Find duplicates — only report blocks found in multiple files,
    // or in the same file but with non-overlapping locations (gap > MIN_LINES).
    const issues: Issue[] = [];
    const reportedHashes = new Set<string>();
    for (const [hash, locations] of codeBlocks) {
      if (locations.length <= 1 || reportedHashes.has(hash)) continue;

      // Deduplicate overlapping locations within the same file
      const uniqueLocations: CodeBlockLocation[] = [];
      for (const loc of locations) {
        const overlaps = uniqueLocations.some(
          (u) =>
            u.file === loc.file && Math.abs(u.line - loc.line) < this.MIN_LINES,
        );
        if (!overlaps) {
          uniqueLocations.push(loc);
        }
      }

      if (uniqueLocations.length > 1) {
        reportedHashes.add(hash);
        issues.push(
          createIssue({
            severity: "warning",
            category: "duplication",
            code: "D001",
            message: `Duplicate code block found in ${uniqueLocations.length} locations`,
            location: uniqueLocations[0],
          }),
        );
      }
    }

    const score = this.calculateScore(issues);

    return {
      phase: "quality",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.3,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        duplicateBlocks: issues.length,
        filesScanned: filesToCheck.length,
      },
    };
  }

  private collectBlocks(
    filePath: string,
    content: string,
    codeBlocks: Map<string, CodeBlockLocation[]>,
  ): void {
    const lines = content.split("\n");

    for (let i = 0; i <= lines.length - this.MIN_LINES; i++) {
      const block = lines
        .slice(i, i + this.MIN_LINES)
        .map((line) => line.trim())
        .filter((line) => {
          return (
            line.length > 0 &&
            !line.startsWith("//") &&
            !line.startsWith("*") &&
            !line.startsWith("/*") &&
            !line.startsWith("import ") &&
            !line.startsWith("export ")
          );
        })
        .join("\n");

      if (block.length < this.MIN_CHARS) continue;

      const codeChars = block.replace(/[{}\[\]();,\s]/g, "");
      if (codeChars.length < 30) continue;

      const hash = crypto.createHash("md5").update(block).digest("hex");

      if (!codeBlocks.has(hash)) {
        codeBlocks.set(hash, []);
      }
      codeBlocks.get(hash)!.push({ file: filePath, line: i + 1 });
    }
  }
}
