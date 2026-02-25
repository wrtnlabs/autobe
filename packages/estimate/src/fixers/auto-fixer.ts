import * as fs from "fs";

import type { Issue } from "../types";

interface FixResult {
  file: string;
  code: string;
  fixed: boolean;
  description: string;
}

export class AutoFixer {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  async fix(issues: Issue[]): Promise<FixResult[]> {
    const results: FixResult[] = [];
    const fixable = issues.filter((i) => this.canFix(i));

    if (fixable.length === 0) {
      return results;
    }

    const byFile = new Map<string, Issue[]>();
    for (const issue of fixable) {
      if (!issue.location?.file) continue;
      const existing = byFile.get(issue.location.file) || [];
      existing.push(issue);
      byFile.set(issue.location.file, existing);
    }

    for (const [file, fileIssues] of byFile) {
      try {
        let content = await fs.promises.readFile(file, "utf-8");
        let changed = false;

        for (const issue of fileIssues) {
          const before = content;
          content = this.applyFix(content, issue);

          if (content !== before) {
            changed = true;
            results.push({
              file,
              code: issue.code,
              fixed: true,
              description: `Fixed ${issue.code}: ${issue.message}`,
            });
            if (this.verbose) {
              console.log(`  ✅ Fixed ${issue.code} in ${file}`);
            }
          }
        }

        if (changed) {
          await fs.promises.writeFile(file, content, "utf-8");
        }
      } catch (err) {
        results.push({
          file,
          code: fileIssues[0].code,
          fixed: false,
          description: `Failed to fix: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      }
    }

    return results;
  }

  private canFix(issue: Issue): boolean {
    return ["TS1161", "TS7006"].includes(issue.code);
  }

  private applyFix(content: string, issue: Issue): string {
    switch (issue.code) {
      case "TS1161":
        return this.fixUnterminatedRegex(content, issue);
      case "TS7006":
        return this.fixImplicitAny(content, issue);
      default:
        return content;
    }
  }

  private fixUnterminatedRegex(content: string, issue: Issue): string {
    // LLM puts literal newlines inside regex and strings
    // Broken:  .replace(/\n/g, "\\n")  (where \n are actual newlines)
    // Fixed:   .replace(/\n/g, "\\n")  (proper escape sequences)

    // Look for .replace(/ + newline + /g, " + optional backslash + newline + ")
    const broken = '.replace(/\n/g, "\\\n")';
    const fixed = '.replace(/\\n/g, "\\\\n")';

    if (content.includes(broken)) {
      return content.replace(broken, fixed);
    }

    // Also try without the backslash
    const broken2 = '.replace(/\n/g, "\n")';
    const fixed2 = '.replace(/\\n/g, "\\\\n")';

    if (content.includes(broken2)) {
      return content.replace(broken2, fixed2);
    }

    return content;
  }

  private fixImplicitAny(content: string, issue: Issue): string {
    const lines = content.split("\n");
    const lineIdx = (issue.location?.line || 1) - 1;
    if (lineIdx >= lines.length) return content;

    const paramMatch = issue.message.match(/Parameter '(\w+)'/);
    if (!paramMatch) return content;

    const paramName = paramMatch[1];
    const line = lines[lineIdx];

    const regex = new RegExp(`(\\b${paramName})(\\s*[,)=])`, "g");
    lines[lineIdx] = line.replace(regex, `$1: any$2`);

    return lines.join("\n");
  }

  getSummary(results: FixResult[]): string {
    const fixed = results.filter((r) => r.fixed).length;
    const failed = results.filter((r) => !r.fixed).length;
    return `Auto-fix complete: ${fixed} fixed, ${failed} failed`;
  }
}
