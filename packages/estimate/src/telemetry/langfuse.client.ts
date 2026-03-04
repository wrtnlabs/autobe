import { Langfuse } from "langfuse";
import type { LangfuseSpanClient, LangfuseTraceClient } from "langfuse";

import type { EvaluationResult, PhaseResult } from "../types";

let client: Langfuse | null = null;
let activeTrace: LangfuseTraceClient | null = null;

export function getLangfuse(): Langfuse | null {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    return null;
  }
  if (!client) {
    client = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST ?? "http://localhost:3001",
    });
  }
  return client;
}

export async function flushLangfuse(): Promise<void> {
  if (client) {
    await client.flushAsync();
  }
}

/** Metadata for creating an evaluation trace */
export interface EvalTraceMeta {
  model: string;
  project: string;
  inputPath: string;
}

/**
 * Create a trace for one evaluation run. Returns null if Langfuse is not
 * configured.
 */
export function createEvalTrace(
  meta: EvalTraceMeta,
): LangfuseTraceClient | null {
  const lf = getLangfuse();
  if (!lf) return null;

  return lf.trace({
    name: `estimate/${meta.model}/${meta.project}`,
    metadata: {
      model: meta.model,
      project: meta.project,
      inputPath: meta.inputPath,
    },
    tags: [meta.model, meta.project],
  });
}

/** Create a span for one evaluation phase (gate, scoring, golden set, etc.) */
export function startPhaseSpan(
  trace: LangfuseTraceClient,
  phaseName: string,
  input?: Record<string, unknown>,
): LangfuseSpanClient {
  return trace.span({
    name: phaseName,
    input,
  });
}

/** End a phase span with its result. */
export function endPhaseSpan(
  span: LangfuseSpanClient,
  result: PhaseResult,
): void {
  span.end({
    output: {
      passed: result.passed,
      score: result.score,
      maxScore: result.maxScore,
      issueCount: result.issues.length,
      metrics: result.metrics,
    },
  });
}

/** Record all scores on a trace: total + per-dimension. */
/**
 * Set the active trace for automatic generation tracking. LLMClient uses this
 * to attach generations to the current trace.
 */
export function setActiveTrace(trace: LangfuseTraceClient | null): void {
  activeTrace = trace;
}

export function getActiveTrace(): LangfuseTraceClient | null {
  return activeTrace;
}

export function recordScores(
  trace: LangfuseTraceClient,
  result: EvaluationResult,
): void {
  // Total score
  trace.score({
    name: "total",
    value: result.totalScore,
    comment: `Grade: ${result.grade}`,
  });

  // Per-phase scores
  const phaseEntries = Object.entries(result.phases) as [string, PhaseResult][];
  for (const [key, phase] of phaseEntries) {
    trace.score({
      name: key,
      value: phase.score,
      comment: phase.passed ? "passed" : "failed",
    });
  }
}
