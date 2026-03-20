import type { EvaluationResult, PhaseResult } from "../types";
import { PHASE_NAMES } from "../types";

/** Phase correlation entry */
interface PhaseCorrelation {
  phaseA: string;
  phaseB: string;
  correlation: number;
  strength: "strong" | "moderate" | "weak" | "none";
}

/** Insight from cross-phase analysis */
interface CorrelationInsight {
  type: "bottleneck" | "coupling" | "independence" | "outlier";
  description: string;
  phases: string[];
}

/** Full correlation report */
export interface CorrelationReport {
  /** Pairwise phase correlations */
  correlations: PhaseCorrelation[];
  /** Actionable insights derived from correlation data */
  insights: CorrelationInsight[];
  /** Phase score summary across all results */
  phaseStats: Record<
    string,
    { mean: number; stddev: number; min: number; max: number }
  >;
}

const SCORING_PHASES = [
  "documentQuality",
  "requirementsCoverage",
  "testCoverage",
  "logicCompleteness",
  "apiCompleteness",
] as const;

type ScoringPhase = (typeof SCORING_PHASES)[number];

/** Compute Pearson correlation coefficient */
function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function correlationStrength(
  r: number,
): "strong" | "moderate" | "weak" | "none" {
  const abs = Math.abs(r);
  if (abs >= 0.7) return "strong";
  if (abs >= 0.4) return "moderate";
  if (abs >= 0.2) return "weak";
  return "none";
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/** Extract phase score from evaluation result */
function getPhaseScore(result: EvaluationResult, phase: ScoringPhase): number {
  const phaseResult = result.phases[phase] as PhaseResult | undefined;
  return phaseResult?.score ?? 0;
}

/** Generate cross-phase correlation report from batch results */
export function generateCorrelationReport(
  results: EvaluationResult[],
): CorrelationReport {
  // Only analyze results where gate passed (otherwise phases are all 0)
  const validResults = results.filter((r) => r.phases.gate.passed);

  if (validResults.length < 3) {
    return {
      correlations: [],
      insights: [
        {
          type: "independence",
          description:
            "Insufficient data for correlation analysis (need at least 3 gate-passing results)",
          phases: [],
        },
      ],
      phaseStats: {},
    };
  }

  // Collect score vectors per phase
  const vectors: Record<ScoringPhase, number[]> = {} as Record<
    ScoringPhase,
    number[]
  >;
  for (const phase of SCORING_PHASES) {
    vectors[phase] = validResults.map((r) => getPhaseScore(r, phase));
  }

  // Compute pairwise correlations
  const correlations: PhaseCorrelation[] = [];
  for (let i = 0; i < SCORING_PHASES.length; i++) {
    for (let j = i + 1; j < SCORING_PHASES.length; j++) {
      const phaseA = SCORING_PHASES[i];
      const phaseB = SCORING_PHASES[j];
      const r = pearsonCorrelation(vectors[phaseA], vectors[phaseB]);
      correlations.push({
        phaseA: PHASE_NAMES[phaseA],
        phaseB: PHASE_NAMES[phaseB],
        correlation: Math.round(r * 100) / 100,
        strength: correlationStrength(r),
      });
    }
  }

  // Compute phase stats
  const phaseStats: CorrelationReport["phaseStats"] = {};
  for (const phase of SCORING_PHASES) {
    const scores = vectors[phase];
    phaseStats[PHASE_NAMES[phase]] = {
      mean: Math.round(mean(scores)),
      stddev: Math.round(stddev(scores) * 10) / 10,
      min: Math.min(...scores),
      max: Math.max(...scores),
    };
  }

  // Also include gate score stats
  const gateScores = validResults.map((r) => r.phases.gate.score);
  phaseStats["Gate"] = {
    mean: Math.round(mean(gateScores)),
    stddev: Math.round(stddev(gateScores) * 10) / 10,
    min: Math.min(...gateScores),
    max: Math.max(...gateScores),
  };

  // Derive insights
  const insights = deriveInsights(correlations, phaseStats, vectors);

  return { correlations, insights, phaseStats };
}

function deriveInsights(
  correlations: PhaseCorrelation[],
  phaseStats: CorrelationReport["phaseStats"],
  vectors: Record<ScoringPhase, number[]>,
): CorrelationInsight[] {
  const insights: CorrelationInsight[] = [];

  // 1. Bottleneck detection — phases with consistently low scores
  for (const [phase, stats] of Object.entries(phaseStats)) {
    if (phase === "Gate") continue;
    if (stats.mean < 60 && stats.stddev < 15) {
      insights.push({
        type: "bottleneck",
        description: `${phase} is a consistent bottleneck (mean=${stats.mean}, stddev=${stats.stddev})`,
        phases: [phase],
      });
    }
  }

  // 2. Strong positive couplings
  for (const c of correlations) {
    if (c.strength === "strong" && c.correlation > 0) {
      insights.push({
        type: "coupling",
        description: `${c.phaseA} and ${c.phaseB} are strongly correlated (r=${c.correlation}). Improving one likely improves the other.`,
        phases: [c.phaseA, c.phaseB],
      });
    }
  }

  // 3. Independent phases (no correlation)
  const independentPairs = correlations.filter((c) => c.strength === "none");
  if (independentPairs.length > 0) {
    for (const c of independentPairs) {
      insights.push({
        type: "independence",
        description: `${c.phaseA} and ${c.phaseB} are independent (r=${c.correlation}). They measure distinct quality dimensions.`,
        phases: [c.phaseA, c.phaseB],
      });
    }
  }

  // 4. Outlier detection — phases with high stddev
  for (const [phase, stats] of Object.entries(phaseStats)) {
    if (phase === "Gate") continue;
    if (stats.stddev > 25) {
      insights.push({
        type: "outlier",
        description: `${phase} has high variance (stddev=${stats.stddev}, range=${stats.min}-${stats.max}). Model/project choice strongly affects this phase.`,
        phases: [phase],
      });
    }
  }

  return insights;
}

/** Format correlation report as markdown */
export function formatCorrelationMarkdown(report: CorrelationReport): string {
  const lines: string[] = [];
  lines.push("# Cross-Phase Correlation Analysis\n");

  // Phase stats table
  lines.push("## Phase Score Statistics\n");
  lines.push("| Phase | Mean | StdDev | Min | Max |");
  lines.push("|-------|------|--------|-----|-----|");
  for (const [phase, stats] of Object.entries(report.phaseStats)) {
    lines.push(
      `| ${phase} | ${stats.mean} | ${stats.stddev} | ${stats.min} | ${stats.max} |`,
    );
  }
  lines.push("");

  // Correlation matrix
  if (report.correlations.length > 0) {
    lines.push("## Pairwise Correlations\n");
    lines.push("| Phase A | Phase B | r | Strength |");
    lines.push("|---------|---------|---|----------|");
    for (const c of report.correlations.sort(
      (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation),
    )) {
      lines.push(
        `| ${c.phaseA} | ${c.phaseB} | ${c.correlation.toFixed(2)} | ${c.strength} |`,
      );
    }
    lines.push("");
  }

  // Insights
  if (report.insights.length > 0) {
    lines.push("## Insights\n");
    for (const insight of report.insights) {
      const icon =
        insight.type === "bottleneck"
          ? "🔴"
          : insight.type === "coupling"
            ? "🔗"
            : insight.type === "outlier"
              ? "📊"
              : "🔀";
      lines.push(`- ${icon} **${insight.type}**: ${insight.description}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
