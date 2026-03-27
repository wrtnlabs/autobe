import { AutoBeDatabaseCompiler } from "@autobe/compiler";
import path from "path";

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
      // If controllers/providers exist but no Prisma schema, the pipeline
      // output is incomplete — flag as warning so gate score is penalized.
      const hasCode =
        context.files.controllers.length > 0 ||
        context.files.providers.length > 0;
      return {
        passed: true,
        issues: hasCode
          ? [
              createIssue({
                severity: "warning",
                category: "prisma",
                code: "P002",
                message:
                  "No Prisma schema found but controllers/providers exist — database layer may be missing",
              }),
            ]
          : [],
        metrics: {
          skipped: !hasCode,
          reason: hasCode
            ? "No Prisma schema but code exists"
            : "No Prisma schemas found",
        },
      };
    }

    // Read all prisma schema files into Record<string, string>
    // EmbedPrisma writes files to {tmpdir}/schemas/{key} without creating
    // intermediate directories, so keys must be bare filenames (no subdirs).
    const rawPrismaFiles = await this.readFilesAsRecord(
      context.files.prismaSchemas,
      context.project.rootPath,
    );
    const prismaFiles: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawPrismaFiles)) {
      prismaFiles[path.basename(key)] = value;
    }

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
