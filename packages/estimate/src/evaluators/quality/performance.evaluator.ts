import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, PhaseResult } from "../../types";
import { BaseEvaluator } from "../base";

/** Performance metrics for generated code */
export interface PerformanceMetrics {
  /** Total source code size in bytes */
  totalSizeBytes: number;
  /** Total source code size in KB (human-readable) */
  totalSizeKB: number;
  /** Total number of TypeScript source files */
  totalFiles: number;
  /** Average file size in bytes */
  avgFileSizeBytes: number;
  /** Largest file path and size */
  largestFile: { file: string; sizeBytes: number } | null;
  /** Lines of code (total across all TS files) */
  totalLines: number;
  /** Average lines per file */
  avgLinesPerFile: number;
  /** File count by category */
  fileCounts: {
    controllers: number;
    providers: number;
    structures: number;
    tests: number;
    other: number;
  };
  /** Size by category in bytes */
  sizeByCategory: {
    controllers: number;
    providers: number;
    structures: number;
    tests: number;
    other: number;
  };
}

export class PerformanceEvaluator extends BaseEvaluator {
  readonly name = "PerformanceEvaluator";
  readonly phase = "quality" as const;
  readonly description = "Collects code size and performance metrics";

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();
    const metrics = await this.collectMetrics(context);

    return {
      phase: "quality",
      passed: true,
      score: 100,
      maxScore: 100,
      weightedScore: 0,
      issues: [],
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalSizeKB: metrics.totalSizeKB,
        totalFiles: metrics.totalFiles,
        totalLines: metrics.totalLines,
        avgLinesPerFile: metrics.avgLinesPerFile,
        largestFile: metrics.largestFile?.file ?? "N/A",
        largestFileSizeKB: metrics.largestFile
          ? Math.round(metrics.largestFile.sizeBytes / 1024)
          : 0,
        controllerCount: metrics.fileCounts.controllers,
        providerCount: metrics.fileCounts.providers,
        structureCount: metrics.fileCounts.structures,
        testCount: metrics.fileCounts.tests,
      },
    };
  }

  async collectMetrics(
    context: EvaluationContext,
  ): Promise<PerformanceMetrics> {
    const allFiles = context.files.typescript;
    const controllerSet = new Set(context.files.controllers);
    const providerSet = new Set(context.files.providers);
    const structureSet = new Set(context.files.structures);
    const testSet = new Set(context.files.tests);

    let totalSize = 0;
    let totalLines = 0;
    let largestFile: { file: string; sizeBytes: number } | null = null;

    const fileCounts = {
      controllers: 0,
      providers: 0,
      structures: 0,
      tests: 0,
      other: 0,
    };
    const sizeByCategory = {
      controllers: 0,
      providers: 0,
      structures: 0,
      tests: 0,
      other: 0,
    };

    await Promise.all(
      allFiles.map(async (filePath) => {
        try {
          const stat = await fs.promises.stat(filePath);
          const size = stat.size;
          const content = await fs.promises.readFile(filePath, "utf-8");
          const lines = content.split("\n").length;

          totalSize += size;
          totalLines += lines;

          if (!largestFile || size > largestFile.sizeBytes) {
            largestFile = {
              file: path.relative(context.project.rootPath, filePath),
              sizeBytes: size,
            };
          }

          const category = controllerSet.has(filePath)
            ? "controllers"
            : providerSet.has(filePath)
              ? "providers"
              : structureSet.has(filePath)
                ? "structures"
                : testSet.has(filePath)
                  ? "tests"
                  : "other";

          fileCounts[category]++;
          sizeByCategory[category] += size;
        } catch {
          // skip unreadable files
        }
      }),
    );

    const totalFiles = allFiles.length;
    return {
      totalSizeBytes: totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      totalFiles,
      avgFileSizeBytes: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
      largestFile,
      totalLines,
      avgLinesPerFile: totalFiles > 0 ? Math.round(totalLines / totalFiles) : 0,
      fileCounts,
      sizeByCategory,
    };
  }
}
