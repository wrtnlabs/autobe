import { Langfuse } from "langfuse";
import type { LangfuseTraceClient, LangfuseSpanClient } from "langfuse";
import type { PhaseResult, EvaluationResult } from "../types";
export declare function getLangfuse(): Langfuse | null;
export declare function flushLangfuse(): Promise<void>;
/**
 * Create a trace for one evaluation run.
 * Returns null if Langfuse is not configured.
 */
export declare function createEvalTrace(meta: {
    model: string;
    project: string;
    inputPath: string;
}): LangfuseTraceClient | null;
/**
 * Create a span for one evaluation phase (gate, scoring, golden set, etc.)
 */
export declare function startPhaseSpan(trace: LangfuseTraceClient, phaseName: string, input?: Record<string, unknown>): LangfuseSpanClient;
/**
 * End a phase span with its result.
 */
export declare function endPhaseSpan(span: LangfuseSpanClient, result: PhaseResult): void;
/**
 * Record all scores on a trace: total + per-dimension.
 */
export declare function recordScores(trace: LangfuseTraceClient, result: EvaluationResult): void;
//# sourceMappingURL=langfuse.client.d.ts.map