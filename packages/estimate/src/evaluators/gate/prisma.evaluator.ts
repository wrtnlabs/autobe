import { AutoBeDatabaseCompiler } from "@autobe/compiler";
import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue } from "../../types";
import { createIssue } from "../../types";
import { GateEvaluator } from "../base";

/**
 * Prisma Evaluator Validates Prisma schema using AutoBeDatabaseCompiler
 * (in-memory)
 */
export class PrismaEvaluator extends GateEvaluator {
  readonly name = "PrismaEvaluator";
  readonly description = "Validates Prisma schema using in-memory compiler";

  async checkGate(context: EvaluationContext): Promise<{
    passed: boolean;
    issues: Issue[];
    metrics?: Record<string, number | string | boolean>;
  }> {
    if (context.files.prismaSchemas.length === 0) {
      return {
        passed: true,
        issues: [],
        metrics: { skipped: true, reason: "No Prisma schemas found" },
      };
    }

    // Read all prisma schema files into Record<string, string>
    const prismaFiles = await this.readFilesAsRecord(
      context.files.prismaSchemas,
      context.project.rootPath,
    );

    if (Object.keys(prismaFiles).length === 0) {
      return {
        passed: true,
        issues: [
          createIssue({
            severity: "warning",
            category: "prisma",
            code: "P000",
            message: "Failed to read Prisma schema files",
          }),
        ],
        metrics: { skipped: true },
      };
    }

    try {
      const compiler = new AutoBeDatabaseCompiler();
      const result = await compiler.compilePrismaSchemas({
        files: prismaFiles,
      });

      if (result.type === "success") {
        return {
          passed: true,
          issues: [],
          metrics: { valid: true },
        };
      }

      // Compilation failed
      const errorMessage =
        result.type === "failure"
          ? result.reason.substring(0, 500)
          : `Prisma compilation exception: ${this.cleanErrorMessage(
              result.error instanceof Error
                ? result.error.message
                : typeof result.error === "object" &&
                    result.error !== null &&
                    "message" in result.error
                  ? (result.error as { message: string }).message
                  : String(result.error),
            )}`;

      return {
        passed: false,
        issues: [
          createIssue({
            severity: "critical",
            category: "prisma-error",
            code: "P001",
            message: errorMessage || "Prisma schema validation failed",
          }),
        ],
        metrics: { valid: false },
      };
    } catch (error) {
      return {
        passed: false,
        issues: [
          createIssue({
            severity: "critical",
            category: "prisma-error",
            code: "P001",
            message: `Prisma compilation exception: ${this.cleanErrorMessage(error instanceof Error ? error.message : "Unknown error")}`,
          }),
        ],
        metrics: { valid: false },
      };
    }
  }

  /** Strip temp directory paths from error messages, keep only filenames */
  private cleanErrorMessage(msg: string): string {
    return msg.replace(/\/[^\s']*\/([^\/\s']+\.prisma)/g, "$1");
  }

  private async readFilesAsRecord(
    filePaths: string[],
    rootPath: string,
  ): Promise<Record<string, string>> {
    const entries = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const content = await fs.promises.readFile(filePath, "utf-8");
          const relativePath = path.relative(rootPath, filePath);
          return [relativePath, content] as const;
        } catch {
          return null;
        }
      }),
    );
    return Object.fromEntries(
      entries.filter((e): e is NonNullable<typeof e> => e !== null),
    );
  }
}
