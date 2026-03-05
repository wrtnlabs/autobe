import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue, Phase, PhaseResult } from "../types";

/** Result of measureTime wrapper */
export interface MeasureTimeResult<T> {
  result: T;
  durationMs: number;
}

/** Result of a gate check */
export interface GateCheckResult {
  passed: boolean;
  issues: Issue[];
  metrics?: Record<string, number | string | boolean>;
}

/** Base evaluator abstract class All evaluators must extend this class */
export abstract class BaseEvaluator {
  /** Evaluator name */
  abstract readonly name: string;

  /** Target phase */
  abstract readonly phase: Phase;

  /** Evaluator description */
  abstract readonly description: string;

  /** Run evaluation */
  abstract evaluate(context: EvaluationContext): Promise<PhaseResult>;

  /** Time measurement wrapper */
  protected async measureTime<T>(
    fn: () => Promise<T>,
  ): Promise<MeasureTimeResult<T>> {
    const start = performance.now();
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    return { result, durationMs };
  }

  /**
   * Calculate score based on issues
   *
   * - Critical: -20 points
   * - Warning: -5 points
   * - Suggestion: -1 point
   */
  protected calculateScore(issues: Issue[], baseScore: number = 100): number {
    let score = baseScore;

    for (const issue of issues) {
      switch (issue.severity) {
        case "critical":
          score -= 20;
          break;
        case "warning":
          score -= 5;
          break;
        case "suggestion":
          score -= 1;
          break;
        default: {
          const _exhaustiveCheck: never = issue.severity;
          throw new Error(`Unknown severity: ${_exhaustiveCheck}`);
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /** Log output (for verbose mode) */
  protected log(message: string, verbose: boolean = false): void {
    if (verbose) {
      console.log(`[${this.name}] ${message}`);
    }
  }

  /** Read files and return as record keyed by relative path */
  protected async readFilesAsRecord(
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

/** Gate evaluator abstract class Gate only determines pass/fail */
export abstract class GateEvaluator extends BaseEvaluator {
  readonly phase: Phase = "gate";

  /** Check gate pass status */
  abstract checkGate(context: EvaluationContext): Promise<GateCheckResult>;

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const { result, durationMs } = await this.measureTime(() =>
      this.checkGate(context),
    );

    return {
      phase: "gate",
      passed: result.passed,
      score: result.passed ? 100 : 0,
      maxScore: 100,
      weightedScore: result.passed ? 100 : 0,
      issues: result.issues,
      durationMs,
      metrics: result.metrics,
    };
  }
}
