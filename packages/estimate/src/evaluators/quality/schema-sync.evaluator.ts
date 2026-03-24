import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { createIssue } from "../../types";
import { BaseEvaluator } from "../base";

/** Result of analyzing a single file for schema sync */
interface SchemaSyncFileResult {
  totalTypes: number;
  emptyTypes: number;
  mismatchedProperties: number;
  issues: Issue[];
}

/**
 * Detects empty interfaces/types (SYNC001) and Prisma ↔ Structure property
 * mismatches (SYNC002) in structure (DTO) files.
 *
 * SYNC001: Empty structures like `export type IJoin = {}` indicate that the
 * OpenAPI-to-TypeScript pipeline failed to populate interface properties.
 *
 * SYNC002: DTO properties with `@x-autobe-database-schema-property` annotations
 * that reference columns not found in the corresponding Prisma model.
 */
export class SchemaSyncEvaluator extends BaseEvaluator {
  readonly name = "SchemaSyncEvaluator";
  readonly phase = "quality" as const;
  readonly description =
    "Detects empty interfaces and Prisma ↔ Structure mismatches";

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
    let mismatchedProperties = 0;

    // Parse Prisma models for SYNC002
    const prismaModels = await this.parsePrismaModels(
      context.files.prismaSchemas,
    );

    const results = await Promise.all(
      context.files.structures.map((filePath) =>
        this.analyzeFile(filePath, context.project.rootPath, prismaModels),
      ),
    );

    for (const result of results) {
      totalTypes += result.totalTypes;
      emptyTypes += result.emptyTypes;
      mismatchedProperties += result.mismatchedProperties;
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
        mismatchedProperties,
        prismaModelsFound: prismaModels.size,
      },
    };
  }

  /**
   * Parse all Prisma schema files and extract model names with their column and
   * relation names.
   */
  private async parsePrismaModels(
    prismaFiles: string[],
  ): Promise<Map<string, Set<string>>> {
    const models = new Map<string, Set<string>>();

    for (const filePath of prismaFiles) {
      try {
        const content = await fs.promises.readFile(filePath, "utf-8");
        const lines = content.split("\n");
        let currentModel: string | null = null;

        for (const line of lines) {
          // Match: model shopping_mall_products {
          const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
          if (modelMatch) {
            currentModel = modelMatch[1];
            if (!models.has(currentModel)) {
              models.set(currentModel, new Set());
            }
            continue;
          }

          // Match closing brace
          if (line.trim() === "}" && currentModel) {
            currentModel = null;
            continue;
          }

          // Inside a model — extract column/relation name (first word)
          if (currentModel) {
            const memberMatch = line.match(/^\s+(\w+)\s+\w+/);
            if (memberMatch) {
              const memberName = memberMatch[1];
              // Skip Prisma directives and comments
              if (
                !memberName.startsWith("@@") &&
                !memberName.startsWith("//")
              ) {
                models.get(currentModel)!.add(memberName);
              }
            }
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    return models;
  }

  private async analyzeFile(
    filePath: string,
    rootPath: string,
    prismaModels: Map<string, Set<string>>,
  ): Promise<SchemaSyncFileResult> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const issues: Issue[] = [];
      let totalTypes = 0;
      let emptyTypes = 0;
      let mismatchedProperties = 0;
      const relativePath = path.relative(rootPath, filePath);

      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // --- SYNC001: Empty type/interface detection ---

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

        // Match: multi-line empty interface (opening brace on same line, closing brace within 2 lines)
        const ifaceOpenMatch = line.match(
          /export\s+interface\s+(\w+)[\s<].*\{\s*$/,
        );
        if (ifaceOpenMatch) {
          // Look ahead up to 2 lines for a closing brace with only whitespace between
          let isEmptyMultiline = false;
          for (let k = i + 1; k < Math.min(i + 3, lines.length); k++) {
            const nextLine = lines[k].trim();
            if (nextLine === "}") {
              // Check that all lines between opening and closing are blank
              const betweenLines = lines
                .slice(i + 1, k)
                .every((l) => l.trim().length === 0);
              if (betweenLines) {
                isEmptyMultiline = true;
              }
              break;
            }
            if (nextLine.length > 0 && nextLine !== "}") break;
          }

          totalTypes++;
          if (isEmptyMultiline) {
            emptyTypes++;
            issues.push(
              createIssue({
                severity: "warning",
                category: "completeness",
                code: "SYNC001",
                message: `Empty interface: ${ifaceOpenMatch[1]} {} — missing properties`,
                location: { file: relativePath, line: i + 1 },
              }),
            );
          }
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

        // --- SYNC002: Prisma ↔ Structure mismatch detection ---

        // Look for @x-autobe-database-schema-property annotation
        const propMatch = line.match(
          /@x-autobe-database-schema-property\s+(\w+)/,
        );
        if (!propMatch) continue;

        const referencedColumn = propMatch[1];

        // Look for @x-autobe-specification in nearby lines to find model name
        // Search backwards up to 5 lines for the specification annotation
        let modelName: string | null = null;
        for (let j = i; j >= Math.max(0, i - 5); j--) {
          const specMatch = lines[j].match(
            /@x-autobe-specification\s+.*?(\w+)\.(\w+)/,
          );
          if (specMatch) {
            modelName = specMatch[1];
            break;
          }
        }

        // Also check the current line and next line
        if (!modelName && i + 1 < lines.length) {
          const specMatch = lines[i + 1].match(
            /@x-autobe-specification\s+.*?(\w+)\.(\w+)/,
          );
          if (specMatch) {
            modelName = specMatch[1];
          }
        }

        if (!modelName) continue;

        // Check if model exists
        const modelMembers = prismaModels.get(modelName);
        if (!modelMembers) {
          mismatchedProperties++;
          issues.push(
            createIssue({
              severity: "warning",
              category: "completeness",
              code: "SYNC002",
              message: `Prisma model "${modelName}" not found — referenced by @x-autobe-database-schema-property ${referencedColumn}`,
              location: { file: relativePath, line: i + 1 },
            }),
          );
          continue;
        }

        // Check if column exists in model
        if (!modelMembers.has(referencedColumn)) {
          mismatchedProperties++;
          issues.push(
            createIssue({
              severity: "warning",
              category: "completeness",
              code: "SYNC002",
              message: `Column "${referencedColumn}" not found in Prisma model "${modelName}"`,
              location: { file: relativePath, line: i + 1 },
            }),
          );
        }
      }

      return { totalTypes, emptyTypes, mismatchedProperties, issues };
    } catch {
      return {
        totalTypes: 0,
        emptyTypes: 0,
        mismatchedProperties: 0,
        issues: [],
      };
    }
  }
}
