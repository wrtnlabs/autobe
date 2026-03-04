import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { BaseEvaluator } from "../base";

/** Result of analyzing a single file for schema sync */
interface SchemaSyncFileResult {
  totalTypes: number;
  emptyTypes: number;
  issues: Issue[];
}

/**
 * Detects empty interfaces/types in structure (DTO) files.
 *
 * Empty structures like `export type IJoin = {}` indicate that the
 * OpenAPI-to-TypeScript pipeline failed to populate interface properties. This
 * causes downstream TS2353 errors when code tries to use those types.
 */
export class SchemaSyncEvaluator extends BaseEvaluator {
  readonly name = "SchemaSyncEvaluator";
  readonly phase = "quality" as const;
  readonly description = "Detects empty interfaces in structure/DTO files";

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();
    const issues: Issue[] = [];

    if (context.files.structures.length === 0) {
      return {
        phase: "quality",
        passed: true,
        score: 100,
        maxScore: 100,
        weightedScore: 0,
        issues: [],
        durationMs: Math.round(performance.now() - startTime),
        metrics: { skipped: true, reason: "No structure files found" },
      };
    }

    let totalTypes = 0;
    let emptyTypes = 0;

    const results = await Promise.all(
      context.files.structures.map((filePath) =>
        this.analyzeFile(filePath, context.project.rootPath),
      ),
    );

    for (const result of results) {
      totalTypes += result.totalTypes;
      emptyTypes += result.emptyTypes;
      issues.push(...result.issues);
    }

    const emptyRatio = totalTypes > 0 ? emptyTypes / totalTypes : 0;
    const score = this.calculateScore(issues);

    return {
      phase: "quality",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: 0,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalStructureFiles: context.files.structures.length,
        totalTypes,
        emptyTypes,
        emptyRatio: Math.round(emptyRatio * 100),
      },
    };
  }

  private async analyzeFile(
    filePath: string,
    rootPath: string,
  ): Promise<SchemaSyncFileResult> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const issues: Issue[] = [];
      let totalTypes = 0;
      let emptyTypes = 0;
      const relativePath = path.relative(rootPath, filePath);

      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Match: export type IFoo = {};
        const typeMatch = line.match(
          /export\s+type\s+(\w+)\s*=\s*\{\s*\}\s*;?$/,
        );
        if (typeMatch) {
          totalTypes++;
          emptyTypes++;
          issues.push(
            createIssue({
              severity: "warning",
              category: "completeness",
              code: "SYNC001",
              message: `Empty type alias: ${typeMatch[1]} = {} — missing properties`,
              location: { file: relativePath, line: i + 1 },
            }),
          );
          continue;
        }

        // Match: export interface IFoo {} (single line)
        const ifaceMatch = line.match(
          /export\s+interface\s+(\w+)[\s<].*\{\s*\}$/,
        );
        if (ifaceMatch) {
          totalTypes++;
          emptyTypes++;
          issues.push(
            createIssue({
              severity: "warning",
              category: "completeness",
              code: "SYNC001",
              message: `Empty interface: ${ifaceMatch[1]} {} — missing properties`,
              location: { file: relativePath, line: i + 1 },
            }),
          );
          continue;
        }

        // Count non-empty type/interface declarations
        if (
          /export\s+(type|interface)\s+\w+/.test(line) &&
          !typeMatch &&
          !ifaceMatch
        ) {
          totalTypes++;
        }
      }

      return { totalTypes, emptyTypes, issues };
    } catch {
      return { totalTypes: 0, emptyTypes: 0, issues: [] };
    }
  }
}
