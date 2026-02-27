"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLangfuse = getLangfuse;
exports.flushLangfuse = flushLangfuse;
exports.createEvalTrace = createEvalTrace;
exports.startPhaseSpan = startPhaseSpan;
exports.endPhaseSpan = endPhaseSpan;
exports.recordScores = recordScores;
const langfuse_1 = require("langfuse");
let client = null;
function getLangfuse() {
    if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
        return null;
    }
    if (!client) {
        client = new langfuse_1.Langfuse({
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl: process.env.LANGFUSE_HOST ?? "http://localhost:3001",
        });
    }
    return client;
}
async function flushLangfuse() {
    if (client) {
        await client.flushAsync();
    }
}
/**
 * Create a trace for one evaluation run.
 * Returns null if Langfuse is not configured.
 */
function createEvalTrace(meta) {
    const lf = getLangfuse();
    if (!lf)
        return null;
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
/**
 * Create a span for one evaluation phase (gate, scoring, golden set, etc.)
 */
function startPhaseSpan(trace, phaseName, input) {
    return trace.span({
        name: phaseName,
        input,
    });
}
/**
 * End a phase span with its result.
 */
function endPhaseSpan(span, result) {
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
/**
 * Record all scores on a trace: total + per-dimension.
 */
function recordScores(trace, result) {
    // Total score
    trace.score({
        name: "total",
        value: result.totalScore,
        comment: `Grade: ${result.grade}`,
    });
    // Per-phase scores
    const phaseEntries = Object.entries(result.phases);
    for (const [key, phase] of phaseEntries) {
        trace.score({
            name: key,
            value: phase.score,
            comment: phase.passed ? "passed" : "failed",
        });
    }
}
//# sourceMappingURL=langfuse.client.js.map