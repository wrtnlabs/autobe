import { AutoBeDatabaseCompiler } from "@autobe/compiler";

import type { EvaluationContext } from "../../types";
import { createIssue } from "../../types";
import { GateCheckResult, GateEvaluator } from "../base";

/**
 * Prisma Evaluator Validates Prisma schema using AutoBeDatabaseCompiler
 * (in-memory)
 */
export class PrismaEvaluator extends GateEvaluator {
  readonly name = "PrismaEvaluator";
  readonly description = "Validates Prisma schema using in-memory compiler";

  async checkGate(context: EvaluationContext): Promise<GateCheckResult> {
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
        passed: false,
        issues: [
          createIssue({
            severity: "critical",
            category: "prisma",
            code: "P000",
            message: "Failed to read Prisma schema files",
          }),
        ],
        metrics: { valid: false },
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
                  ? String((result.error as Record<string, unknown>).message)
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
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        passed: false,
        issues: [
          createIssue({
            severity: "critical",
            category: "prisma-error",
            code: "P001",
            message: `Prisma compilation exception: ${this.cleanErrorMessage(msg)}`,
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
}
