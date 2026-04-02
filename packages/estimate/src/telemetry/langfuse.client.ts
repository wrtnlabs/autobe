import { Langfuse } from "langfuse";
import type { LangfuseSpanClient, LangfuseTraceClient } from "langfuse";

import type { AgentResult } from "../agents/types";
import { AGENT_WEIGHT_RATIO } from "../types";
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
    try {
      await client.flushAsync();
    } catch (err) {
      console.warn(
        `Langfuse flush failed: ${err instanceof Error ? err.message : err}`,
      );
    }
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

  // Golden set category breakdown (if available)
  const goldenSet = result.phases.goldenSet;
  if (goldenSet?.metrics) {
    const m = goldenSet.metrics;
    if (m.categoryScore !== undefined) {
      trace.score({
        name: "goldenSet_categoryScore",
        value: m.categoryScore as number,
        comment: "Category-weighted pass rate",
      });
    }
    if (m.consistencyScore !== undefined) {
      trace.score({
        name: "goldenSet_consistencyScore",
        value: m.consistencyScore as number,
        comment: "Data consistency (schema warnings)",
      });
    }
    // Contract evaluator metrics
    if (m.contractPassed !== undefined) {
      trace.score({
        name: "contract_passRate",
        value: (m.contractPassRate as number) ?? 0,
        comment: `${m.contractPassed}/${m.contractEndpoints} endpoints passed`,
      });
    }
  }

  // Penalty breakdown (if available)
  if (result.penalties) {
    const penaltySpan = trace.span({ name: "penalties" });
    penaltySpan.end({
      output: result.penalties,
    });
  }
}

/** Record agent evaluation results as spans + scores on the trace. */
export function recordAgentResults(
  trace: LangfuseTraceClient,
  agentResults: AgentResult[],
  finalScore: number,
): void {
  for (const agent of agentResults) {
    const span = trace.span({
      name: `agent/${agent.agent}`,
      input: { model: agent.model, provider: agent.provider },
    });
    span.end({
      output: {
        score: agent.score,
        issueCount: agent.issues.length,
        criticalCount: agent.issues.filter((i) => i.severity === "critical")
          .length,
        summary: agent.summary,
        durationMs: agent.durationMs,
        tokensUsed: agent.tokensUsed,
      },
    });

    // Skip failed agents (score=-1) to avoid polluting telemetry
    if (agent.score >= 0) {
      trace.score({
        name: `agent_${agent.agent}`,
        value: agent.score,
        comment: `${agent.model} | ${agent.issues.length} issues`,
      });
    }
  }

  // Update total score with agent-adjusted value
  trace.score({
    name: "total_with_agents",
    value: finalScore,
    comment: `Final score including agent evaluation (${Math.round(AGENT_WEIGHT_RATIO * 100)}%)`,
  });
}
