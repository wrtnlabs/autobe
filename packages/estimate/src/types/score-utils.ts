import type { Issue } from "./issue";
import type {
  Grade,
  IssueSummary,
  Phase,
  PhaseResult,
  ScoreExplanation,
} from "./score";

/** Convert score to grade */
export function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/** Create empty PhaseResult */
export function createEmptyPhaseResult(phase: Phase): PhaseResult {
  return {
    phase,
    passed: true,
    score: 0,
    maxScore: 100,
    weightedScore: 0,
    issues: [],
    durationMs: 0,
  };
}

/** Generate score explanation from issues */
export function generateExplanation(
  issues: Issue[],
  score: number,
): ScoreExplanation {
  const reasons: string[] = [];
  const suggestions: string[] = [];

  const issuesByCode = new Map<string, Issue[]>();
  for (const issue of issues) {
    const existing = issuesByCode.get(issue.code) || [];
    existing.push(issue);
    issuesByCode.set(issue.code, existing);
  }

  const issueSummaries: IssueSummary[] = Array.from(issuesByCode).map(
    ([code, codeIssues]) => ({
      code,
      count: codeIssues.length,
      message: codeIssues[0].message,
      severity: codeIssues[0].severity,
    }),
  );

  issueSummaries.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, suggestion: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  if (criticalCount > 0) {
    reasons.push(`${criticalCount} critical issue(s) found`);
    suggestions.push("Fix all critical issues first");
  }

  if (warningCount > 10) {
    reasons.push(`${warningCount} warnings detected`);
    suggestions.push("Address warnings to improve quality");
  }

  for (const summary of issueSummaries.slice(0, 3)) {
    reasons.push(`${summary.count}x ${summary.message}`);
  }

  return { reasons, issueSummaries, suggestions };
}
